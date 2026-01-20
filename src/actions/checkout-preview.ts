"use server";

/**
 * Checkout VAT Preview Action (N2.4)
 *
 * Computes VAT breakdown for checkout preview using the same logic
 * as order creation. Returns per-vendor and overall totals.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeVatFromGross,
  computeVatFromNet,
  getEffectiveTaxProfile,
} from "@/lib/vat";

/** VAT breakdown for a single vendor (SubOrder equivalent) */
export interface VendorVatBreakdown {
  vendorId: string;
  vendorName: string;
  /** Number of distinct cart line items (not sum of quantities) */
  itemCount: number;
  netTotalCents: number;
  vatTotalCents: number;
  grossTotalCents: number;
}

/** Overall VAT breakdown for checkout preview */
export interface CheckoutVatPreview {
  vendors: VendorVatBreakdown[];
  totals: {
    netTotalCents: number;
    vatTotalCents: number;
    grossTotalCents: number;
  };
  /** Effective VAT percentage for display (weighted average, display-only) */
  effectiveVatPercent: number | null;
}

export type CheckoutVatPreviewResult =
  | { success: true; data: CheckoutVatPreview }
  | { success: false; error: string };

/**
 * Compute VAT preview for the current user's cart.
 * Uses the same VAT computation logic as order creation.
 */
export async function getCheckoutVatPreview(): Promise<CheckoutVatPreviewResult> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "CLIENT" || !user.clientId) {
      return {
        success: false,
        error: "Only clients can view checkout preview",
      };
    }

    // Load cart with items and VAT-related data
    const cart = await prisma.cart.findFirst({
      where: {
        clientId: user.clientId,
        status: "ACTIVE",
      },
      include: {
        CartItem: {
          include: {
            VendorProduct: {
              include: {
                Product: {
                  select: {
                    id: true,
                    name: true,
                    taxProfileId: true,
                    TaxProfile: {
                      select: {
                        id: true,
                        vatRateBps: true,
                      },
                    },
                    ProductCategory: {
                      select: {
                        taxProfileId: true,
                        TaxProfile: {
                          select: {
                            id: true,
                            vatRateBps: true,
                          },
                        },
                      },
                    },
                  },
                },
                Vendor: {
                  select: {
                    id: true,
                    name: true,
                    priceIncludesVat: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.CartItem.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Group cart items by vendor
    const itemsByVendor = new Map<string, typeof cart.CartItem>();
    for (const item of cart.CartItem) {
      const vendorId = item.VendorProduct.Vendor.id;
      if (!itemsByVendor.has(vendorId)) {
        itemsByVendor.set(vendorId, []);
      }
      itemsByVendor.get(vendorId)!.push(item);
    }

    // Compute VAT breakdown for each vendor
    const vendors: VendorVatBreakdown[] = [];
    let overallNet = 0;
    let overallVat = 0;
    let overallGross = 0;

    for (const [vendorId, items] of itemsByVendor.entries()) {
      const vendorName = items[0].VendorProduct.Vendor.name;
      const priceIncludesVat = items[0].VendorProduct.Vendor.priceIncludesVat;

      let vendorNet = 0;
      let vendorVat = 0;
      let vendorGross = 0;

      for (const item of items) {
        // Warn if price is missing (data integrity issue)
        if (item.unitPriceCents === null || item.unitPriceCents === undefined) {
          console.warn(
            `Cart item ${item.id} has null unitPriceCents, treating as 0`
          );
        }
        const lineTotalCents = (item.unitPriceCents ?? 0) * item.qty;
        const product = item.VendorProduct.Product;

        // Resolve effective tax profile
        const taxProfile = await getEffectiveTaxProfile({
          product: {
            taxProfileId: product.taxProfileId,
            TaxProfile: product.TaxProfile,
            ProductCategory: product.ProductCategory,
          },
        });

        // Compute VAT based on vendor's pricing mode
        let vatComputation;
        if (priceIncludesVat) {
          // GROSS pricing: lineTotalCents is gross (VAT-inclusive)
          vatComputation = computeVatFromGross(
            lineTotalCents,
            taxProfile.vatRateBps,
          );
        } else {
          // NET pricing: lineTotalCents is net (VAT-exclusive)
          vatComputation = computeVatFromNet(
            lineTotalCents,
            taxProfile.vatRateBps,
          );
        }

        vendorNet += vatComputation.netCents;
        vendorVat += vatComputation.vatCents;
        vendorGross += vatComputation.grossCents;
      }

      vendors.push({
        vendorId,
        vendorName,
        itemCount: items.length,
        netTotalCents: vendorNet,
        vatTotalCents: vendorVat,
        grossTotalCents: vendorGross,
      });

      overallNet += vendorNet;
      overallVat += vendorVat;
      overallGross += vendorGross;
    }

    // Sort vendors by name
    vendors.sort((a, b) => a.vendorName.localeCompare(b.vendorName));

    // Compute effective VAT percentage for display (display-only, safe rounding)
    const effectiveVatPercent =
      overallNet > 0
        ? Math.round((overallVat / overallNet) * 100 * 100) / 100
        : null;

    return {
      success: true,
      data: {
        vendors,
        totals: {
          netTotalCents: overallNet,
          vatTotalCents: overallVat,
          grossTotalCents: overallGross,
        },
        effectiveVatPercent,
      },
    };
  } catch (error) {
    console.error("Error computing checkout VAT preview:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to compute VAT preview",
    };
  }
}
