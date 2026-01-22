import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subOrder: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe-auth", () => ({
  authorizeSubOrderCharge: vi.fn(),
  captureSubOrderPayment: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  AuditAction: {},
  logSystemAction: vi.fn(),
}));

describe("GET /api/jobs/payment-retry", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.CRON_SECRET = originalSecret;
    vi.resetAllMocks();
  });

  it("requires bearer secret in production", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/jobs/payment-retry/route");
    const request = new NextRequest("http://localhost/api/jobs/payment-retry");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("rejects invalid bearer token in production", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/jobs/payment-retry/route");
    const request = new NextRequest("http://localhost/api/jobs/payment-retry", {
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("accepts valid bearer token in production", async () => {
    vi.resetModules();
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.subOrder.findMany).mockResolvedValue([]);

    const { GET } = await import("@/app/api/jobs/payment-retry/route");
    const request = new NextRequest(
      "http://localhost/api/jobs/payment-retry?dryRun=1",
      {
        headers: {
          authorization: "Bearer test-secret",
        },
      },
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dryRun).toBe(true);
  });
});
