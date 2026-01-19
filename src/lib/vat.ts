/**
 * VAT Computation Helpers (N1.3)
 *
 * All amounts are in cents (integers). VAT rates use basis points (bps):
 * - 2200 bps = 22.00%
 * - 1000 bps = 10.00%
 * - 400 bps = 4.00%
 * - 0 bps = 0.00% (exempt)
 *
 * NO FLOATS for tax math. All calculations use integers with rounding.
 */

import { prisma } from "@/lib/prisma";

/** Result of VAT computation with net, VAT, and gross amounts in cents */
export interface VatComputationResult {
  netCents: number;
  vatCents: number;
  grossCents: number;
}

/**
 * Compute VAT breakdown from a GROSS amount (VAT-inclusive pricing).
 *
 * Formula: net = gross * 10000 / (10000 + vatRateBps)
 *          vat = gross - net
 *
 * @param grossCents - Total amount including VAT (in cents)
 * @param vatRateBps - VAT rate in basis points (e.g., 2200 for 22%)
 * @returns Object with netCents, vatCents, grossCents
 * @throws Error if grossCents < 0 or vatRateBps < 0
 */
export function computeVatFromGross(
  grossCents: number,
  vatRateBps: number,
): VatComputationResult {
  if (grossCents < 0) {
    throw new Error("grossCents cannot be negative");
  }
  if (vatRateBps < 0) {
    throw new Error("vatRateBps cannot be negative");
  }

  // Handle 0% VAT (exempt)
  if (vatRateBps === 0) {
    return {
      netCents: grossCents,
      vatCents: 0,
      grossCents: grossCents,
    };
  }

  // net = gross * 10000 / (10000 + vatRateBps)
  // Using integer math with rounding
  const netCents = Math.round((grossCents * 10000) / (10000 + vatRateBps));
  const vatCents = grossCents - netCents;

  // Defensive check: invariant should always hold by construction (vat = gross - net),
  // but we verify in case the formula or rounding logic is modified in future refactoring.
  if (netCents + vatCents !== grossCents) {
    throw new Error(
      `VAT invariant violated: ${netCents} + ${vatCents} !== ${grossCents}`,
    );
  }

  return {
    netCents,
    vatCents,
    grossCents,
  };
}

/**
 * Compute VAT breakdown from a NET amount (VAT-exclusive pricing).
 *
 * Formula: vat = net * vatRateBps / 10000
 *          gross = net + vat
 *
 * @param netCents - Amount before VAT (in cents)
 * @param vatRateBps - VAT rate in basis points (e.g., 2200 for 22%)
 * @returns Object with netCents, vatCents, grossCents
 * @throws Error if netCents < 0 or vatRateBps < 0
 */
export function computeVatFromNet(
  netCents: number,
  vatRateBps: number,
): VatComputationResult {
  if (netCents < 0) {
    throw new Error("netCents cannot be negative");
  }
  if (vatRateBps < 0) {
    throw new Error("vatRateBps cannot be negative");
  }

  // Handle 0% VAT (exempt)
  if (vatRateBps === 0) {
    return {
      netCents: netCents,
      vatCents: 0,
      grossCents: netCents,
    };
  }

  // vat = net * vatRateBps / 10000
  const vatCents = Math.round((netCents * vatRateBps) / 10000);
  const grossCents = netCents + vatCents;

  // Invariant always holds by construction (gross = net + vat)
  return {
    netCents,
    vatCents,
    grossCents,
  };
}

/** Tax profile result from resolution */
export interface EffectiveTaxProfile {
  taxProfileId: string;
  vatRateBps: number;
}

/** Product shape for tax profile extraction */
interface ProductWithTaxRelations {
  taxProfileId: string | null;
  TaxProfile?: { id: string; vatRateBps: number } | null;
  ProductCategory?: {
    taxProfileId: string | null;
    TaxProfile?: { id: string; vatRateBps: number } | null;
  } | null;
}

/**
 * Extract tax profile from a product object (handles both product-level and category-level).
 * Returns null if no tax profile is found at either level.
 */
function extractTaxProfileFromProduct(
  product: ProductWithTaxRelations,
): EffectiveTaxProfile | null {
  // 1. Product-level override
  if (product.taxProfileId && product.TaxProfile) {
    return {
      taxProfileId: product.TaxProfile.id,
      vatRateBps: product.TaxProfile.vatRateBps,
    };
  }

  // 2. Category-level tax profile
  if (
    product.ProductCategory?.taxProfileId &&
    product.ProductCategory.TaxProfile
  ) {
    return {
      taxProfileId: product.ProductCategory.TaxProfile.id,
      vatRateBps: product.ProductCategory.TaxProfile.vatRateBps,
    };
  }

  return null;
}

/**
 * Resolve the effective TaxProfile for a product.
 *
 * Resolution order:
 * 1. Product.taxProfileId (explicit override)
 * 2. ProductCategory.taxProfileId (inherited from category)
 * 3. TaxProfile with isDefault=true or named "reduced_10" (global fallback)
 * 4. Throws error if no profile found (fail fast to prevent invalid FK references)
 *
 * @param params - Either { productId: string } or { product: { taxProfileId, category, ... } }
 * @returns EffectiveTaxProfile with taxProfileId and vatRateBps
 * @throws Error if no TaxProfile can be resolved
 */
export async function getEffectiveTaxProfile(params: {
  productId?: string;
  product?: ProductWithTaxRelations;
}): Promise<EffectiveTaxProfile> {
  const { productId, product } = params;

  // If product object is provided with relations, try to extract directly
  if (product) {
    const extracted = extractTaxProfileFromProduct(product);
    if (extracted) {
      return extracted;
    }
  }

  // If productId provided, or product object lacks relations, fetch from DB
  if (productId) {
    const dbProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        taxProfileId: true,
        TaxProfile: {
          select: { id: true, vatRateBps: true },
        },
        ProductCategory: {
          select: {
            taxProfileId: true,
            TaxProfile: {
              select: { id: true, vatRateBps: true },
            },
          },
        },
      },
    });

    if (dbProduct) {
      const extracted = extractTaxProfileFromProduct(dbProduct);
      if (extracted) {
        return extracted;
      }
    }
  }

  // 3. Global fallback: isDefault=true OR named "reduced_10", preferring isDefault
  const fallbackProfile = await prisma.taxProfile.findFirst({
    where: {
      OR: [{ isDefault: true }, { name: "reduced_10" }],
    },
    orderBy: {
      isDefault: "desc", // Prioritize isDefault=true
    },
    select: { id: true, vatRateBps: true },
  });

  if (fallbackProfile) {
    return {
      taxProfileId: fallbackProfile.id,
      vatRateBps: fallbackProfile.vatRateBps,
    };
  }

  // 4. Fail fast: No valid TaxProfile found
  // This should never happen in production if TaxProfile records are properly seeded.
  // Throwing ensures we don't create OrderItems with invalid taxProfileId FK references.
  throw new Error(
    "No TaxProfile found for product. Ensure TaxProfile records are seeded " +
      "(run db:seed) and products/categories have tax profiles assigned.",
  );
}
