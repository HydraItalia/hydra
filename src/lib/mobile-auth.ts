import { randomBytes, createHash } from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// ── Helpers ──────────────────────────────────────────────────────────────────

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) throw new Error("MOBILE_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

// ── JWT Payload ──────────────────────────────────────────────────────────────

export interface MobileJwtPayload extends JWTPayload {
  sub: string;
  email: string;
  role: "DRIVER";
  iss: "hydra-mobile";
}

// ── Magic Token ──────────────────────────────────────────────────────────────

const MAGIC_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function createMagicToken(
  userId: string,
  email: string,
): Promise<string> {
  const raw = randomBytes(48).toString("hex");
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + MAGIC_TOKEN_TTL_MS);

  await prisma.mobileMagicToken.create({
    data: { tokenHash, userId, email, expiresAt },
  });

  return raw;
}

export async function consumeMagicToken(
  raw: string,
): Promise<{ userId: string; email: string } | null> {
  const tokenHash = sha256(raw);
  const now = new Date();

  // Atomically mark as used (only succeeds if usedAt is still null)
  const { count } = await prisma.mobileMagicToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gte: now } },
    data: { usedAt: now },
  });
  if (count === 0) return null;

  const token = await prisma.mobileMagicToken.findUnique({
    where: { tokenHash },
  });
  if (!token) return null;

  return { userId: token.userId, email: token.email };
}

// ── Access Token (JWT) ───────────────────────────────────────────────────────

const ACCESS_TOKEN_TTL_S = 900; // 15 minutes

export async function signAccessToken(payload: {
  sub: string;
  email: string;
  role: "DRIVER";
}): Promise<string> {
  return new SignJWT({ ...payload, iss: "hydra-mobile" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_S}s`)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<MobileJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "hydra-mobile",
    });
    return payload as MobileJwtPayload;
  } catch {
    return null;
  }
}

// ── Refresh Token ────────────────────────────────────────────────────────────

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createRefreshToken(
  userId: string,
): Promise<{ raw: string; expiresAt: Date }> {
  const raw = randomBytes(48).toString("hex");
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.mobileRefreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });

  return { raw, expiresAt };
}

export async function rotateRefreshToken(
  rawOld: string,
): Promise<{ raw: string; expiresAt: Date; userId: string } | null> {
  const oldHash = sha256(rawOld);
  const now = new Date();

  // Revoke old token atomically
  const { count } = await prisma.mobileRefreshToken.updateMany({
    where: { tokenHash: oldHash, revokedAt: null, expiresAt: { gte: now } },
    data: { revokedAt: now },
  });
  if (count === 0) return null;

  const old = await prisma.mobileRefreshToken.findUnique({
    where: { tokenHash: oldHash },
  });
  if (!old) return null;

  // Issue new token for the same user
  const { raw, expiresAt } = await createRefreshToken(old.userId);
  return { raw, expiresAt, userId: old.userId };
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const tokenHash = sha256(raw);
  await prisma.mobileRefreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ── Request Auth Helper ──────────────────────────────────────────────────────

export async function verifyMobileRequest(
  req: NextRequest,
): Promise<MobileJwtPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyAccessToken(token);
}
