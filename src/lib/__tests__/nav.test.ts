import { describe, it, expect } from "vitest";
import { getNavItems, getUserInitials, getRoleLabel } from "../nav";

describe("nav utilities", () => {
  describe("getNavItems", () => {
    it("should return correct nav items for ADMIN", () => {
      const items = getNavItems("ADMIN");

      expect(items).toHaveLength(12);
      expect(items.map((item) => item.label)).toEqual([
        "Dashboard",
        "Vendors",
        "Clients",
        "Agents",
        "Approvals",
        "Catalog",
        "Orders",
        "Deliveries",
        "Failed Payments",
        "Shifts",
        "Smistamento Ordini",
        "Reports",
      ]);

      expect(items[0].href).toBe("/dashboard");
      expect(items[1].href).toBe("/dashboard/vendors");
    });

    it("should return correct nav items for AGENT", () => {
      const items = getNavItems("AGENT");

      expect(items).toHaveLength(10);
      expect(items.map((item) => item.label)).toEqual([
        "Dashboard",
        "Vendors",
        "Clients",
        "Catalog",
        "Orders",
        "Deliveries",
        "Failed Payments",
        "Shifts",
        "Smistamento Ordini",
        "Reports",
      ]);
    });

    it("should return correct nav items for VENDOR", () => {
      const items = getNavItems("VENDOR");

      expect(items).toHaveLength(4);
      expect(items.map((item) => item.label)).toEqual([
        "Dashboard",
        "My Inventory",
        "Orders",
        "Settings",
      ]);

      expect(items[1].href).toBe("/dashboard/inventory");
    });

    it("should return correct nav items for CLIENT", () => {
      const items = getNavItems("CLIENT");

      expect(items).toHaveLength(5);
      expect(items.map((item) => item.label)).toEqual([
        "Dashboard",
        "Catalog",
        "My Cart",
        "Orders",
        "Payment Methods",
      ]);

      expect(items[2].href).toBe("/dashboard/cart");
    });

    it("should include icons for all nav items", () => {
      const adminItems = getNavItems("ADMIN");
      const vendorItems = getNavItems("VENDOR");
      const clientItems = getNavItems("CLIENT");

      adminItems.forEach((item) => {
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe("object"); // Lucide icons are React components (objects)
      });

      vendorItems.forEach((item) => {
        expect(item.icon).toBeDefined();
      });

      clientItems.forEach((item) => {
        expect(item.icon).toBeDefined();
      });
    });

    it("should return empty array for invalid role", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = getNavItems("INVALID" as any);
      expect(items).toEqual([]);
    });
  });

  describe("getUserInitials", () => {
    it("should return initials from full name", () => {
      expect(getUserInitials("John Doe", "john@example.com")).toBe("JD");
      expect(getUserInitials("Alice Smith", "alice@example.com")).toBe("AS");
    });

    it("should return first two letters from single name", () => {
      expect(getUserInitials("Admin", "admin@example.com")).toBe("AD");
      expect(getUserInitials("Bob", "bob@example.com")).toBe("BO");
    });

    it("should fall back to email if no name", () => {
      expect(getUserInitials(null, "john@example.com")).toBe("JO");
      expect(getUserInitials(undefined, "admin@hydra.local")).toBe("AD");
    });

    it("should return U as last fallback", () => {
      expect(getUserInitials(null, "")).toBe("U");
      expect(getUserInitials(undefined, "")).toBe("U");
    });

    it("should uppercase initials", () => {
      expect(getUserInitials("john doe", "test@example.com")).toBe("JD");
      expect(getUserInitials("alice", "test@example.com")).toBe("AL");
    });
  });

  describe("getRoleLabel", () => {
    it("should return correct label for each role", () => {
      expect(getRoleLabel("ADMIN")).toBe("Administrator");
      expect(getRoleLabel("AGENT")).toBe("Agent");
      expect(getRoleLabel("VENDOR")).toBe("Vendor");
      expect(getRoleLabel("CLIENT")).toBe("Client");
    });
  });
});
