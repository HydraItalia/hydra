/**
 * Middleware - Vercel Edge Runtime Compatible
 *
 * IMPORTANT: This middleware runs in Vercel's Edge Runtime, which cannot
 * open TCP connections to AWS RDS PostgreSQL. Therefore, we DO NOT use
 * Auth.js or Prisma here.
 *
 * Authentication is enforced in Node.js runtime via:
 * - src/app/dashboard/layout.tsx (Server Component with currentUser())
 * - Individual page/layout components as needed
 *
 * This middleware is kept minimal to remain Edge-compatible while supporting
 * future lightweight routing logic if needed (e.g., redirects, rewrites).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // No auth checks here - handled in Node runtime layouts/pages
  return NextResponse.next();
}

export const config = {
  // Match dashboard routes (can expand as needed)
  matcher: ["/dashboard/:path*"],
};
