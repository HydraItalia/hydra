"use server";

/**
 * Phase 6.2 - Vendor Inventory Server Actions
 *
 * Server actions for managing vendor inventory including viewing and updating products.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { VendorProduct, Product } from "@prisma/client";

// Low stock threshold constant
const LOW_STOCK_THRESHOLD = 10;

// Filter types for inventory views
export type InventoryFilter = "ALL" | "ACTIVE" | "INACTIVE" | "LOW_STOCK";

// Extended VendorProduct type with Product details
export type VendorInventoryItem = VendorProduct & {
  Product: Product;
};

// Input type for updating inventory
export type UpdateInventoryInput = {
  vendorProductId: string;
  basePriceCents?: number;
  isActive?: boolean;
  stockQty?: number;
};

// Result type for server actions
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get vendor inventory with optional filtering
 */
export async function getVendorInventory(
  filter: InventoryFilter = "ALL"
): Promise<ActionResult<VendorInventoryItem[]>> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "VENDOR") {
      return { success: false, error: "Unauthorized: Vendor access required" };
    }

    if (!user.vendorId) {
      return {
        success: false,
        error: "No vendor associated with this account",
      };
    }

    // Build filter conditions based on filter type
    const whereConditions: {
      vendorId: string;
      deletedAt: null;
      isActive?: boolean;
      stockQty?: { lt: number };
    } = {
      vendorId: user.vendorId,
      deletedAt: null,
    };

    switch (filter) {
      case "ACTIVE":
        whereConditions.isActive = true;
        break;
      case "INACTIVE":
        whereConditions.isActive = false;
        break;
      case "LOW_STOCK":
        // Low stock: active items with stockQty below threshold
        whereConditions.isActive = true;
        whereConditions.stockQty = { lt: LOW_STOCK_THRESHOLD };
        break;
      case "ALL":
      default:
        // No additional filters
        break;
    }

    const inventory = await prisma.vendorProduct.findMany({
      where: whereConditions,
      include: {
        Product: true,
      },
      orderBy: [
        { isActive: "desc" }, // Active items first
        { Product: { name: "asc" } }, // Then alphabetically
      ],
    });

    return { success: true, data: inventory };
  } catch (error) {
    console.error("Error fetching vendor inventory:", error);
    return {
      success: false,
      error: "Failed to fetch inventory",
    };
  }
}

/**
 * Update a vendor inventory item
 */
export async function updateVendorInventoryItem(
  input: UpdateInventoryInput
): Promise<ActionResult<VendorProduct>> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "VENDOR") {
      return { success: false, error: "Unauthorized: Vendor access required" };
    }

    if (!user.vendorId) {
      return {
        success: false,
        error: "No vendor associated with this account",
      };
    }

    // First, verify ownership
    const existingProduct = await prisma.vendorProduct.findUnique({
      where: { id: input.vendorProductId },
    });

    if (!existingProduct) {
      return { success: false, error: "Product not found" };
    }

    if (existingProduct.vendorId !== user.vendorId) {
      return {
        success: false,
        error: "Unauthorized: You do not own this product",
      };
    }

    // Validate inputs
    if (input.basePriceCents !== undefined && input.basePriceCents < 0) {
      return { success: false, error: "Price must be non-negative" };
    }

    if (input.stockQty !== undefined && input.stockQty < 0) {
      return { success: false, error: "Stock quantity must be non-negative" };
    }

    // Build update data object (only include provided fields)
    const updateData: {
      basePriceCents?: number;
      isActive?: boolean;
      stockQty?: number;
    } = {};
    if (input.basePriceCents !== undefined)
      updateData.basePriceCents = input.basePriceCents;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.stockQty !== undefined) updateData.stockQty = input.stockQty;

    // Update the product
    const updatedProduct = await prisma.vendorProduct.update({
      where: { id: input.vendorProductId },
      data: updateData,
    });

    // Revalidate the inventory page
    revalidatePath("/dashboard/inventory");

    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Error updating vendor inventory:", error);
    return {
      success: false,
      error: "Failed to update inventory item",
    };
  }
}

/**
 * Get inventory statistics for vendor dashboard
 */
export async function getVendorInventoryStats(): Promise<
  ActionResult<{
    activeCount: number;
    inactiveCount: number;
    lowStockCount: number;
    totalCount: number;
  }>
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "VENDOR") {
      return { success: false, error: "Unauthorized: Vendor access required" };
    }

    if (!user.vendorId) {
      return {
        success: false,
        error: "No vendor associated with this account",
      };
    }

    const [activeCount, inactiveCount, lowStockCount] = await Promise.all([
      prisma.vendorProduct.count({
        where: {
          vendorId: user.vendorId,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.vendorProduct.count({
        where: {
          vendorId: user.vendorId,
          isActive: false,
          deletedAt: null,
        },
      }),
      prisma.vendorProduct.count({
        where: {
          vendorId: user.vendorId,
          isActive: true,
          deletedAt: null,
          stockQty: { lt: LOW_STOCK_THRESHOLD },
        },
      }),
    ]);

    const totalCount = activeCount + inactiveCount;

    return {
      success: true,
      data: {
        activeCount,
        inactiveCount,
        lowStockCount,
        totalCount,
      },
    };
  } catch (error) {
    console.error("Error fetching vendor inventory stats:", error);
    return {
      success: false,
      error: "Failed to fetch inventory statistics",
    };
  }
}
