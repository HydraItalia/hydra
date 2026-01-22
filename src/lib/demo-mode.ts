/**
 * Demo Mode Utilities
 *
 * Provides utilities for checking and managing demo mode state
 *
 * SECURITY: Demo mode is NEVER enabled in production, regardless of env vars.
 * This prevents accidental exposure of the demo Credentials provider which
 * bypasses email verification.
 */

export type DemoUser = {
  email: string;
  name: string;
  role: "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";
  description: string;
};

const isProduction = process.env.NODE_ENV === "production";
const envWantsDemo = process.env.ENABLE_DEMO_MODE?.toLowerCase() === "true";

// Log warning if demo mode is attempted in production
if (isProduction && envWantsDemo) {
  console.error(
    "\n" +
      "╔═══════════════════════════════════════════════════════════════════════╗\n" +
      "║  ⚠️  SECURITY WARNING: ENABLE_DEMO_MODE=true in production!           ║\n" +
      "║                                                                       ║\n" +
      "║  Demo mode has been DISABLED to protect your application.             ║\n" +
      "║  Demo mode bypasses email verification and must never run in prod.    ║\n" +
      "║                                                                       ║\n" +
      "║  Remove ENABLE_DEMO_MODE from your production environment variables.  ║\n" +
      "╚═══════════════════════════════════════════════════════════════════════╝\n"
  );
}

/**
 * Check if demo mode is enabled
 * Demo mode allows one-click signin for testing and demos
 *
 * IMPORTANT: Always returns false in production, regardless of env var.
 * This is a security measure to prevent demo mode from ever running in prod.
 */
export function isDemoModeEnabled(): boolean {
  // SECURITY: Never enable demo mode in production
  if (isProduction) {
    return false;
  }
  return envWantsDemo;
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
