import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Minimal middleware - auth is handled in dashboard/layout.tsx
 * This exists to satisfy Next.js but does nothing
 */
export default function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
