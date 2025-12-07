import { auth } from "./auth";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  // use auth(req) here with proper try/catch, only on dashboard routes
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
