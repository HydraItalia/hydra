import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  consumeMagicToken,
  signAccessToken,
  createRefreshToken,
} from "@/lib/mobile-auth";

const bodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await consumeMagicToken(parsed.data.token);
  if (!result) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [accessToken, refresh] = await Promise.all([
    signAccessToken({ sub: user.id, email: user.email, role: "DRIVER" }),
    createRefreshToken(user.id),
  ]);

  return NextResponse.json({
    accessToken,
    refreshToken: refresh.raw,
    expiresIn: 900,
    driver: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
