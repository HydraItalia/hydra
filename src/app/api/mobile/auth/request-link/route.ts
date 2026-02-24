import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createMagicToken } from "@/lib/mobile-auth";
import { sendEmailViaResend } from "@/lib/email/resend";
import { magicLinkEmail } from "@/lib/email/magic-link-template";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  // Always return ok: true to prevent email enumeration
  const okResponse = () => NextResponse.json({ ok: true });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, email: true },
    });

    if (!user || user.role !== "DRIVER") {
      return okResponse();
    }

    const raw = await createMagicToken(user.id, user.email);

    const baseUrl =
      process.env.BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/mobile/auth/callback?token=${raw}`;

    // Dev mode: log to console instead of sending email
    const isDevMode =
      process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false";

    if (isDevMode) {
      console.log(
        "\n[mobile-auth] Magic link (dev mode):\n",
        callbackUrl,
        "\n",
      );
      return okResponse();
    }

    const { html, text } = magicLinkEmail({ url: callbackUrl });
    await sendEmailViaResend({
      to: user.email,
      from: process.env.EMAIL_FROM || "hydra@localhost.dev",
      subject: "Sign in to Hydra Driver",
      html,
      text,
    });
  } catch (error) {
    console.error("[mobile-auth] request-link error:", error);
    // Still return ok to prevent enumeration
  }

  return okResponse();
}
