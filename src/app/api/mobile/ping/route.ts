import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hydra",
    ts: new Date().toISOString(),
  });
}
