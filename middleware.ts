import { auth } from "./auth";
import { NextResponse } from "next/server";

/**
 * Status-based route gating middleware
 *
 * Rules:
 * - Public routes: /, /signin, /api/auth/* — always accessible
 * - /onboarding, /pending — accessible to authenticated users regardless of status
 * - /dashboard/* — only accessible to APPROVED users
 *   - No status / undefined → redirect to /onboarding
 *   - PENDING → redirect to /pending
 *   - REJECTED/SUSPENDED → redirect to /pending?reason=rejected or ?reason=suspended
 *   - APPROVED → allow through
 */
export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;
  const pathname = nextUrl.pathname;

  // Public routes — no gating
  if (
    pathname === "/" ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Not authenticated — let NextAuth's authorized callback handle redirect to /signin
  if (!user) {
    return NextResponse.next();
  }

  const status = user.status;
  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isPending = pathname.startsWith("/pending");

  // APPROVED users trying to access /onboarding or /pending — send to dashboard
  if (status === "APPROVED" && (isOnboarding || isPending)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Dashboard routes require APPROVED status
  if (isDashboard) {
    if (!status) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
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
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/pending/:path*"],
};
