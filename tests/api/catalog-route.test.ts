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

  it("returns catalog data when authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(fetchCatalogPage).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 24,
      hasNextPage: false,
    } as any);

    const request = new NextRequest("http://localhost/api/catalog");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 24,
      hasNextPage: false,
    });
    expect(fetchCatalogPage).toHaveBeenCalled();
  });

  it("passes query params to catalog fetch", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(fetchCatalogPage).mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 5,
      hasNextPage: false,
    } as any);

    const request = new NextRequest(
      "http://localhost/api/catalog?group=frozen&category=ice-cream&q=pistachio&inStock=1&cursor=abc&page=2&pageSize=5",
    );
    await GET(request);

    expect(fetchCatalogPage).toHaveBeenCalledWith({
      group: "FROZEN",
      categorySlug: "ice-cream",
      q: "pistachio",
      inStock: true,
      cursor: "abc",
      page: 2,
      pageSize: 5,
    });
  });

  it("returns 500 when catalog fetch fails", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(fetchCatalogPage).mockRejectedValue(new Error("Catalog failure"));

    const request = new NextRequest("http://localhost/api/catalog");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch catalog" });
  });
});
