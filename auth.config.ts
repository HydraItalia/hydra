import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth Configuration - Authorization & Routing
 *
 * Sign-in Behavior:
 * - All user roles (ADMIN, AGENT, VENDOR, CLIENT) can sign in via magic link
 * - No role-based rejection at auth level - all authenticated users are allowed
 * - Role-specific access control is enforced via:
 *   1. RoleGate components in the UI
 *   2. Server-side role checks in API routes and server actions
 *
 * Routing:
 * - Authenticated users on /signin are redirected to /dashboard
 * - Unauthenticated users can access / (home) and /signin
 * - All other routes require authentication
 */

export const authConfig = {
  // Required for AWS Amplify and other proxied environments
  // Tells Auth.js to trust X-Forwarded-Host and X-Forwarded-Proto headers
  trustHost: true,
  // Secret for JWT signing and encryption
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes — always accessible
      if (pathname === "/" || pathname.startsWith("/api/auth")) {
        return true;
      }

      // Signin page — redirect authenticated users to dashboard
      if (pathname.startsWith("/signin")) {
        if (isLoggedIn)
          return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // /onboarding and /pending — require authentication only (status gating in middleware)
      if (pathname.startsWith("/onboarding") || pathname.startsWith("/pending")) {
        return isLoggedIn;
      }

      // Everything else requires authentication
      return isLoggedIn;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
