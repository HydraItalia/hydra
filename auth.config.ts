import type { NextAuthConfig } from 'next-auth'

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
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnSignIn = nextUrl.pathname.startsWith('/signin')

      if (isOnSignIn) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }

      return isLoggedIn || nextUrl.pathname === '/'
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
