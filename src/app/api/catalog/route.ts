import { NextRequest, NextResponse } from "next/server";
import { fetchCatalogPage } from "@/data/catalog";
import { CategoryGroupType } from "@prisma/client";
import { currentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Require authentication - catalog data should not be publicly accessible
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // Parse query parameters
  const groupParam = searchParams.get("group");
  const group = groupParam?.toUpperCase() as CategoryGroupType | undefined;
  const categorySlug = searchParams.get("category") || undefined;
  const q = searchParams.get("q") || undefined;
  const inStock = searchParams.get("inStock") === "1";
  const cursor = searchParams.get("cursor") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "24");

  try {
    const result = await fetchCatalogPage({
      group,
      categorySlug,
      q,
      inStock,
      cursor: cursor || null,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 },
    );
  }
}
