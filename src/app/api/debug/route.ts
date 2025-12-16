import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL || "";
  const hostMatch = url.match(/@([^:/]+)/);

  return NextResponse.json({
    hasDatabaseUrl: Boolean(url),
    dbHost: hostMatch?.[1] ?? "unknown",
    rawStartsWith: url.slice(0, 30),
  });
}
