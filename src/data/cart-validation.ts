"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

/**
 * Validation issue severity levels
 * - error: blocks checkout
 * - warning: does not block checkout but shown to user
 */
export type CartValidationSeverity = "error" | "warning";

/**
 * Validation issue codes for different cart problems
 */
export type CartValidationCode =
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "VENDOR_INACTIVE"
  | "VENDOR_MISSING"
  | "UNKNOWN_PRODUCT"
  | "INVALID_QUANTITY";

/**
 * A single validation issue for a cart item
 */
export type CartValidationIssue = {
  cartItemId: string;
  vendorProductId: string | null;
  severity: CartValidationSeverity;
  code: CartValidationCode;
  message: string;
  quantityRequested: number;
  quantityAvailable?: number | null;
  vendorName?: string | null;
  productName?: string | null;
};

/**
 * Result of cart validation
 */
export type CartValidationResult = {
  ok: boolean; // false if any severity==="error"
  issues: CartValidationIssue[];
};

/**
 * Validate the current user's cart before checkout
 *
 * Checks:
 * - Stock availability (out of stock, insufficient stock)
 * - Product availability (unknown/deleted products)
 * - Vendor availability (missing vendor, inactive vendor product)
 *
 * @returns CartValidationResult with ok=true if no errors, ok=false if any errors exist
 * @throws Error if user is not authenticated, not CLIENT role, or has no clientId
 */
export async function validateCartForCurrentUser(): Promise<CartValidationResult> {
  // 1. Verify authentication and authorization
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  if (user.role !== "CLIENT") {
    throw new Error(
      "Unauthorized: Only CLIENT users can validate carts for checkout"
    );
  }

  if (!user.clientId) {
    throw new Error(
      "Unauthorized: User does not have an associated client account"
    );
  }

  const clientId = user.clientId;

  // 2. Load cart with all related data
  const cart = await prisma.cart.findFirst({
    where: {
      clientId,
      status: "ACTIVE",
    },
    include: {
      items: {
        include: {
          vendorProduct: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
              vendor: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // 3. Handle empty cart
  // Decision: Return ok=true with no issues. The createOrderFromCart function
  // will handle empty cart validation and throw its own error. This keeps
  // validation focused on item-level issues.
  if (!cart || cart.items.length === 0) {
    return {
      ok: true,
      issues: [],
    };
  }

  // 4. Validate each cart item
  const issues: CartValidationIssue[] = [];

  for (const item of cart.items) {
    const quantityRequested = item.qty;

    // Validate quantity is positive
    if (quantityRequested <= 0) {
      issues.push({
        cartItemId: item.id,
        vendorProductId: item.vendorProductId,
        severity: "error",
        code: "INVALID_QUANTITY",
        message: "Invalid quantity in cart. Please remove this item and re-add it.",
        quantityRequested,
      });
      continue;
    }

    // Check if vendor product still exists
    if (!item.vendorProduct) {
      issues.push({
        cartItemId: item.id,
        vendorProductId: item.vendorProductId,
        severity: "error",
        code: "UNKNOWN_PRODUCT",
        message: "This product is no longer available in the catalog.",
        quantityRequested,
      });
      continue;
    }

    const vendorProduct = item.vendorProduct;
    const productName = vendorProduct.product.name;

    // Check if vendor exists (defensive - should always exist if vendorProduct exists)
    if (!vendorProduct.vendor) {
      issues.push({
        cartItemId: item.id,
        vendorProductId: item.vendorProductId,
        severity: "error",
        code: "VENDOR_MISSING",
        message: `The vendor for ${productName} is no longer available.`,
        quantityRequested,
        productName,
      });
      continue;
    }

    const vendorName = vendorProduct.vendor.name;

    // Check if vendor product is inactive
    if (!vendorProduct.isActive) {
      issues.push({
        cartItemId: item.id,
        vendorProductId: item.vendorProductId,
        severity: "warning",
        code: "VENDOR_INACTIVE",
        message: `${productName} from ${vendorName} is currently inactive.`,
        quantityRequested,
        productName,
        vendorName,
      });
    }

    // Check stock availability
    const stockQty = vendorProduct.stockQty;

    // OUT_OF_STOCK: stock is explicitly 0 or negative
    if (stockQty !== null && stockQty <= 0) {
      issues.push({
        cartItemId: item.id,
        vendorProductId: item.vendorProductId,
        severity: "error",
        code: "OUT_OF_STOCK",
        message: `${productName} from ${vendorName} is out of stock.`,
        quantityRequested,
        quantityAvailable: stockQty,
        productName,
        vendorName,
      });
      continue;
    }

    // INSUFFICIENT_STOCK: stock exists but is less than requested quantity
    if (stockQty !== null && stockQty < quantityRequested && stockQty > 0) {
      issues.push({
        cartItemId: item.id,
        vendorProductId: item.vendorProductId,
        severity: "error",
        code: "INSUFFICIENT_STOCK",
        message: `Only ${stockQty} units of ${productName} from ${vendorName} are available.`,
        quantityRequested,
        quantityAvailable: stockQty,
        productName,
        vendorName,
      });
    }

    // Note: If stockQty is null, we assume stock tracking is not enabled for this
    // product and skip stock validation. This is defensive behavior.
  }

  // 5. Determine if cart is valid
  const hasErrors = issues.some((issue) => issue.severity === "error");

  return {
    ok: !hasErrors,
    issues,
  };
}
