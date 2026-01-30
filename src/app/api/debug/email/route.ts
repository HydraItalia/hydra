/**
 * DEBUG route: Test email delivery via Resend HTTP API.
 *
 * Protected by CRON_SECRET to prevent abuse.
 * Remove or gate behind feature flag after incident is resolved.
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        "https://your-app.vercel.app/api/debug/email?to=test@example.com"
 */

import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaResend } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Auth: require CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = req.nextUrl.searchParams.get("to");
  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { error: "Provide ?to=email@example.com" },
      { status: 400 }
    );
  }

  const diagnostics: Record<string, unknown> = {
    nodeEnv: process.env.NODE_ENV,
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM || "(unset)",
    authEmailDevMode: process.env.AUTH_EMAIL_DEV_MODE ?? "(unset)",
    timestamp: new Date().toISOString(),
  };

  // Test DNS resolution for smtp.resend.com (informational)
  try {
    const dns = await import("dns");
    const resolved = await dns.promises.resolve4("smtp.resend.com");
    diagnostics.smtpDnsResolved = resolved;
  } catch (err: any) {
    diagnostics.smtpDnsError = err.message;
  }

  // Attempt Resend HTTP API send
  try {
    const result = await sendEmailViaResend({
      to,
      from: process.env.EMAIL_FROM || "hydra@localhost.dev",
      subject: "[Hydra Debug] Email delivery test",
      text: "If you received this, Resend HTTP API is working from Vercel.",
      html: "<p>If you received this, <strong>Resend HTTP API</strong> is working from Vercel.</p>",
    });

    return NextResponse.json({
      success: true,
      emailId: result.id,
      diagnostics,
    });
  } catch (err: any) {
    diagnostics.sendError = err.message;
    return NextResponse.json(
      { success: false, diagnostics },
      { status: 500 }
    );
  }
}
