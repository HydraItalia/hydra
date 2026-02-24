import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rotateRefreshToken, signAccessToken } from "@/lib/mobile-auth";

const bodySchema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await rotateRefreshToken(parsed.data.refreshToken);
  if (!result) {
    return NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user || user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: "DRIVER",
  });

  return NextResponse.json({
    accessToken,
    refreshToken: result.raw,
    expiresIn: 900,
  });
}
