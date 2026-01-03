/**
 * Demo Mode Utilities
 *
 * Provides utilities for checking and managing demo mode state
 */

export type DemoUser = {
  email: string;
  name: string;
  role: "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";
  description: string;
};

/**
 * Check if demo mode is enabled
 * Demo mode allows one-click signin for testing and demos
 */
export function isDemoModeEnabled(): boolean {
  return process.env.ENABLE_DEMO_MODE?.toLowerCase() === "true";
}

/**
 * Demo users available for quick signin
 * These match the users created in prisma/seed.ts
 */
export const DEMO_USERS: DemoUser[] = [
  {
    email: "client.demo@hydra.local",
    name: "Demo Ristorante",
    role: "CLIENT",
    description:
      "Restaurant client - browse catalog, create orders, manage cart",
  },
  {
    email: "vendor.generalbeverage@hydra.local",
    name: "Effemme",
    role: "VENDOR",
    description: "Beverage distributor - manage inventory and fulfill orders",
  },
  {
    email: "testvendor@stripe-test.com",
    name: "Test Vendor - Stripe Connect",
    role: "VENDOR",
    description: "Test vendor for Stripe Connect onboarding (safe to test)",
  },
  {
    email: "driver.marco@hydra.local",
    name: "Marco (Driver)",
    role: "DRIVER",
    description: "Delivery driver - view routes and manage deliveries",
  },
  {
    email: "admin@hydra.local",
    name: "Admin User",
    role: "ADMIN",
    description:
      "Full system access - manage all vendors, clients, orders, and users (COMING SOON)",
  },
  {
    email: "andrea@hydra.local",
    name: "Andrea (Agent)",
    role: "AGENT",
    description:
      "Manages White Dog and CD Fish vendors - handle orders and routing (COMING SOON)",
  },
];
