import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/data/catalog", () => ({
  fetchCatalogPage: vi.fn(),
}));

import { GET } from "@/app/api/catalog/route";
import { currentUser } from "@/lib/auth";
import { fetchCatalogPage } from "@/data/catalog";

describe("GET /api/catalog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/catalog");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(fetchCatalogPage).not.toHaveBeenCalled();
  });
});
