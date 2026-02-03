/**
 * Demo Mode Utilities
 *
 * Provides utilities for checking and managing demo mode state
 *
 * SECURITY: Demo mode is controlled by ENABLE_DEMO_MODE env var.
 * In Vercel, this is set per-environment:
 *   - Production: ENABLE_DEMO_MODE=false (demo disabled)
 *   - Preview:    ENABLE_DEMO_MODE=true  (demo enabled)
 *
 * NOTE: We cannot gate on NODE_ENV because Vercel sets NODE_ENV=production
 * for ALL deployed environments (including Preview).
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
 *
 * Controlled entirely by ENABLE_DEMO_MODE env var.
 * Vercel Production has this set to "false", Preview has it set to "true".
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
    email: "vendor.cdfish@hydra.local",
    name: "CD Fish S.r.l.",
    role: "VENDOR",
    description: "Seafood distributor - manage inventory and fulfill orders",
  },
  {
    email: "testvendor@stripe-test.com",
    name: "Test Vendor - Stripe Connect",
    role: "VENDOR",
    description: "Test vendor for Stripe Connect onboarding (safe to test)",
  },
  {
    email: "vendor.ghiacciopuro@hydra.local",
    name: "Ghiaccio Puro",
    role: "VENDOR",
    description: "Ice products vendor - premium ice cubes, spheres, and crushed ice",
  },
  {
    email: "driver.marco@hydra.local",
    name: "Marco (Driver)",
    role: "DRIVER",
    description: "Delivery driver - view routes and manage deliveries",
  },
  {
    email: "brennanlazzara@gmail.com",
    name: "Brennan Lazzara",
    role: "ADMIN",
    description:
      "Full system access - manage all vendors, clients, orders, and users",
  },
  {
    email: "andrea@hydra.local",
    name: "Andrea (Agent)",
    role: "AGENT",
    description:
      "Manages White Dog and CD Fish vendors - handle orders and routing (COMING SOON)",
  },
];
