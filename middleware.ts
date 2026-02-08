import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Status-based route gating middleware (Edge-safe)
 *
 * Uses getToken() to decode the JWT directly — no Prisma, no DB,
 * no Node.js modules. Requires only AUTH_SECRET.
 *
 * Rules:
 * - Public routes: /, /signin, /api/auth/* — always accessible
 * - /onboarding, /pending — accessible to authenticated users regardless of status
 * - /dashboard/* — only accessible to APPROVED users
 *   - ONBOARDING → redirect to /onboarding
 *   - PENDING → redirect to /pending
 *   - REJECTED/SUSPENDED → redirect to /pending?reason=rejected or ?reason=suspended
 *   - APPROVED → allow through
 */
export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Public routes — no gating
  if (
    pathname === "/" ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Decode JWT from cookie (Edge-safe, no DB access)
  // secureCookie must match what Auth.js used when setting the cookie:
  // true on HTTPS (Vercel prod + preview), false on HTTP (local dev)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: nextUrl.protocol === "https:",
  });

  // Not authenticated — redirect to signin with callbackUrl
  if (!token) {
    const signInUrl = new URL("/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname + nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  const status = token.status as string | undefined;
  const role = token.role as string | undefined;
  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isPending = pathname.startsWith("/pending");

  // ONBOARDING users always start at the role-chooser (/onboarding).
  // New accounts get role=CLIENT by default in the DB, so we can't rely
  // on the role to pick a sub-route until the user has actually chosen.
  const onboardingPath = "/onboarding";

  // ADMIN users bypass onboarding/status gating for dashboard routes
  // Admins need full access regardless of their own status
  if (role === "ADMIN" && isDashboard) {
    return NextResponse.next();
  }

  // APPROVED users trying to access /onboarding or /pending — send to dashboard
  if (status === "APPROVED" && (isOnboarding || isPending)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // ONBOARDING users on /pending — redirect to role-specific onboarding
  if (status === "ONBOARDING" && isPending) {
    return NextResponse.redirect(new URL(onboardingPath, nextUrl));
  }

  // PENDING users on /onboarding — redirect to /pending
  if (status === "PENDING" && isOnboarding) {
    return NextResponse.redirect(new URL("/pending", nextUrl));
  }

  // Dashboard routes require APPROVED status (non-ADMIN users)
  if (isDashboard) {
    if (status === "ONBOARDING") {
      return NextResponse.redirect(new URL(onboardingPath, nextUrl));
    }
    if (status === "PENDING") {
      return NextResponse.redirect(new URL("/pending", nextUrl));
    }
    if (status === "REJECTED") {
      return NextResponse.redirect(
        new URL("/pending?reason=rejected", nextUrl),
      );
    }
    if (status === "SUSPENDED") {
      return NextResponse.redirect(
        new URL("/pending?reason=suspended", nextUrl),
      );
    }
    // APPROVED — allow through
    return NextResponse.next();
  }

  // /onboarding and /pending — allow for authenticated users
  if (isOnboarding || isPending) {
    return NextResponse.next();
  }

  // All other routes — allow through (existing page-level checks remain)
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/pending/:path*"],
};
