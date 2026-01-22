import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subOrder: {
      findMany: vi.fn(),
    },
  },
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
    const { GET } = await import("@/app/api/jobs/payment-retry/route");
    const request = new Request("http://localhost/api/jobs/payment-retry");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
