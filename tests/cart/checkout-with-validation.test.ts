import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateCartForCurrentUser } from "@/data/cart-validation";
import { createOrderFromCart } from "@/data/order";

// Mock dependencies
vi.mock("@/data/cart-validation", () => ({
  validateCartForCurrentUser: vi.fn(),
}));

vi.mock("@/data/order", () => ({
  createOrderFromCart: vi.fn(),
}));

describe("Checkout Flow with Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Integration: Validation before Order Creation", () => {
    it("should NOT call createOrderFromCart when validation returns errors", async () => {
      // Mock validation to return errors
      vi.mocked(validateCartForCurrentUser).mockResolvedValue({
        ok: false,
        issues: [
          {
            cartItemId: "item1",
            vendorProductId: "vp1",
            severity: "error",
            code: "OUT_OF_STOCK",
            message: "Product is out of stock",
            quantityRequested: 5,
            quantityAvailable: 0,
          },
        ],
      });

      // Simulate the checkout handler logic
      const validation = await validateCartForCurrentUser();

      let orderCreated = false;
      if (validation.ok) {
        await createOrderFromCart();
        orderCreated = true;
      }

      // Assert that order was NOT created
      expect(orderCreated).toBe(false);
      expect(createOrderFromCart).not.toHaveBeenCalled();
      expect(validation.ok).toBe(false);
      expect(validation.issues).toHaveLength(1);
    });

    it("should call createOrderFromCart when validation returns ok=true", async () => {
      // Mock validation to succeed
      vi.mocked(validateCartForCurrentUser).mockResolvedValue({
        ok: true,
        issues: [],
      });

      // Mock order creation to succeed
      vi.mocked(createOrderFromCart).mockResolvedValue({
        orderId: "order1",
      } as any);

      // Simulate the checkout handler logic
      const validation = await validateCartForCurrentUser();

      let orderId = null;
      if (validation.ok) {
        const result = await createOrderFromCart();
        orderId = result.orderId;
      }

      // Assert that order WAS created
      expect(createOrderFromCart).toHaveBeenCalledTimes(1);
      expect(orderId).toBe("order1");
      expect(validation.ok).toBe(true);
    });

    it("should call createOrderFromCart when validation has only warnings", async () => {
      // Mock validation with warnings (which don't block)
      vi.mocked(validateCartForCurrentUser).mockResolvedValue({
        ok: true,
        issues: [
          {
            cartItemId: "item1",
            vendorProductId: "vp1",
            severity: "warning",
            code: "VENDOR_INACTIVE",
            message: "Vendor product is inactive",
            quantityRequested: 5,
          },
        ],
      });

      // Mock order creation
      vi.mocked(createOrderFromCart).mockResolvedValue({
        orderId: "order1",
      } as any);

      // Simulate the checkout handler logic
      const validation = await validateCartForCurrentUser();

      let orderCreated = false;
      if (validation.ok) {
        await createOrderFromCart();
        orderCreated = true;
      }

      // Assert that order WAS created despite warnings
      expect(orderCreated).toBe(true);
      expect(createOrderFromCart).toHaveBeenCalledTimes(1);
      expect(validation.ok).toBe(true);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].severity).toBe("warning");
    });

    it("should NOT call createOrderFromCart when validation has mixed errors and warnings", async () => {
      // Mock validation with both errors and warnings
      vi.mocked(validateCartForCurrentUser).mockResolvedValue({
        ok: false,
        issues: [
          {
            cartItemId: "item1",
            vendorProductId: "vp1",
            severity: "error",
            code: "OUT_OF_STOCK",
            message: "Product is out of stock",
            quantityRequested: 5,
            quantityAvailable: 0,
          },
          {
            cartItemId: "item2",
            vendorProductId: "vp2",
            severity: "warning",
            code: "VENDOR_INACTIVE",
            message: "Vendor product is inactive",
            quantityRequested: 3,
          },
        ],
      });

      // Simulate the checkout handler logic
      const validation = await validateCartForCurrentUser();

      let orderCreated = false;
      if (validation.ok) {
        await createOrderFromCart();
        orderCreated = true;
      }

      // Assert that order was NOT created due to errors
      expect(orderCreated).toBe(false);
      expect(createOrderFromCart).not.toHaveBeenCalled();
      expect(validation.ok).toBe(false);
      expect(validation.issues).toHaveLength(2);
    });
  });

  describe("Error Flow", () => {
    it("should handle validation errors gracefully", async () => {
      // Mock validation to throw an error
      const validationError = new Error("Unauthorized: User not authenticated");
      vi.mocked(validateCartForCurrentUser).mockRejectedValue(validationError);

      // Simulate the checkout handler with error handling
      let caughtError: Error | null = null;
      try {
        await validateCartForCurrentUser();
      } catch (error) {
        caughtError = error as Error;
      }

      // Assert that error was caught
      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe("Unauthorized: User not authenticated");
      expect(createOrderFromCart).not.toHaveBeenCalled();
    });

    it("should handle order creation errors even after successful validation", async () => {
      // Mock validation to succeed
      vi.mocked(validateCartForCurrentUser).mockResolvedValue({
        ok: true,
        issues: [],
      });

      // Mock order creation to fail
      const orderError = new Error("Cart is empty");
      vi.mocked(createOrderFromCart).mockRejectedValue(orderError);

      // Simulate the checkout handler with error handling
      const validation = await validateCartForCurrentUser();

      let caughtError: Error | null = null;
      if (validation.ok) {
        try {
          await createOrderFromCart();
        } catch (error) {
          caughtError = error as Error;
        }
      }

      // Assert that order creation was attempted and failed
      expect(validation.ok).toBe(true);
      expect(createOrderFromCart).toHaveBeenCalledTimes(1);
      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe("Cart is empty");
    });
  });

  describe("Validation Issue Types", () => {
    it("should handle multiple validation issues correctly", async () => {
      vi.mocked(validateCartForCurrentUser).mockResolvedValue({
        ok: false,
        issues: [
          {
            cartItemId: "item1",
            vendorProductId: "vp1",
            severity: "error",
            code: "OUT_OF_STOCK",
            message: "Product 1 is out of stock",
            quantityRequested: 5,
            quantityAvailable: 0,
            productName: "Product 1",
            vendorName: "Vendor A",
          },
          {
            cartItemId: "item2",
            vendorProductId: "vp2",
            severity: "error",
            code: "INSUFFICIENT_STOCK",
            message: "Only 3 units available",
            quantityRequested: 10,
            quantityAvailable: 3,
            productName: "Product 2",
            vendorName: "Vendor B",
          },
          {
            cartItemId: "item3",
            vendorProductId: null,
            severity: "error",
            code: "UNKNOWN_PRODUCT",
            message: "Product not found",
            quantityRequested: 2,
          },
        ],
      });

      const validation = await validateCartForCurrentUser();

      expect(validation.ok).toBe(false);
      expect(validation.issues).toHaveLength(3);

      const codes = validation.issues.map((issue) => issue.code);
      expect(codes).toContain("OUT_OF_STOCK");
      expect(codes).toContain("INSUFFICIENT_STOCK");
      expect(codes).toContain("UNKNOWN_PRODUCT");

      // All should be errors
      validation.issues.forEach((issue) => {
        expect(issue.severity).toBe("error");
      });
    });

    it("should differentiate between error and warning severities", async () => {
      vi.mocked(validateCartForCurrentUser).mockResolvedValue({
        ok: true,
        issues: [
          {
            cartItemId: "item1",
            vendorProductId: "vp1",
            severity: "warning",
            code: "VENDOR_INACTIVE",
            message: "Vendor is inactive",
            quantityRequested: 5,
            productName: "Product 1",
            vendorName: "Vendor A",
          },
        ],
      });

      const validation = await validateCartForCurrentUser();

      expect(validation.ok).toBe(true); // Warnings don't block
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].severity).toBe("warning");
      expect(validation.issues[0].code).toBe("VENDOR_INACTIVE");
    });
  });
});
