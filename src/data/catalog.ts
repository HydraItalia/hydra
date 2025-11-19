import { prisma } from "@/lib/prisma";
import { CategoryGroupType } from "@prisma/client";

export type CatalogParams = {
  q?: string;
  group?: CategoryGroupType;
  categorySlug?: string;
  inStock?: boolean;
  cursor?: string | null; // product.id for keyset pagination
  page?: number; // for offset pagination
  pageSize: number; // e.g., 24
};

// Minimal select to reduce payload
const productSelect = {
  id: true,
  name: true,
  unit: true,
  imageUrl: true,
  ProductCategory: {
    select: {
      slug: true,
      name: true,
    },
  },
  VendorProduct: {
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      basePriceCents: true,
      stockQty: true,
      leadTimeDays: true,
      Vendor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

export type CatalogProduct = {
  id: string;
  name: string;
  unit: string;
  imageUrl: string | null;
  category: {
    slug: string;
    name: string;
  };
  vendorProducts: Array<{
    id: string;
    basePriceCents: number;
    stockQty: number;
    leadTimeDays: number;
    vendor: {
      id: string;
      name: string;
    };
  }>;
};

export type CatalogResult = {
  data: CatalogProduct[];
  nextCursor: string | null;
  hasNext: boolean;
  total: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
};

export async function fetchCatalogPage(
  params: CatalogParams
): Promise<CatalogResult> {
  const {
    q,
    group,
    categorySlug,
    inStock,
    cursor,
    page = 1,
    pageSize: rawPageSize,
  } = params;

  // Clamp page size between 12 and 60
  const pageSize = Math.min(Math.max(rawPageSize ?? 24, 12), 60);
  const currentPage = Math.max(page, 1);

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    deletedAt: null,
  };

  // Group filter
  if (group) {
    where.ProductCategory = {
      ...where.ProductCategory,
      CategoryGroup: { name: group },
    };
  }

  // Category filter
  if (categorySlug) {
    where.ProductCategory = {
      ...where.ProductCategory,
      slug: categorySlug,
    };
  }

  // Search query
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  // In stock filter (applied in nested query)
  if (inStock) {
    where.VendorProduct = {
      some: {
        isActive: true,
        deletedAt: null,
        stockQty: { gt: 0 },
      },
    };
  }

  // Helper to transform Prisma result to CatalogProduct
  const transformProduct = (product: {
    id: string;
    name: string;
    unit: string;
    imageUrl: string | null;
    ProductCategory: { slug: string; name: string };
    VendorProduct: Array<{
      id: string;
      basePriceCents: number;
      stockQty: number;
      leadTimeDays: number;
      Vendor: { id: string; name: string };
    }>;
  }): CatalogProduct => ({
    id: product.id,
    name: product.name,
    unit: product.unit,
    imageUrl: product.imageUrl,
    category: {
      slug: product.ProductCategory.slug,
      name: product.ProductCategory.name,
    },
    vendorProducts: product.VendorProduct.map((vp) => ({
      id: vp.id,
      basePriceCents: vp.basePriceCents,
      stockQty: vp.stockQty,
      leadTimeDays: vp.leadTimeDays,
      vendor: {
        id: vp.Vendor.id,
        name: vp.Vendor.name,
      },
    })),
  });

  // Keyset pagination (cursor-based) - fetch one extra to detect next page
  if (cursor) {
    const items = await prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: { id: "asc" },
      take: pageSize + 1,
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    });

    const hasNext = items.length > pageSize;
    const rawData = hasNext ? items.slice(0, pageSize) : items;
    const nextCursor = hasNext ? rawData[rawData.length - 1].id : null;

    // Get total count (optional but useful)
    const total = await prisma.product.count({ where });
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: rawData.map(transformProduct),
      nextCursor,
      hasNext,
      total,
      pageSize,
      currentPage,
      totalPages,
    };
  }

  // Offset pagination (page-based) - simpler, better for small/medium datasets
  const offset = (currentPage - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: { id: "asc" },
      take: pageSize,
      skip: offset,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const hasNext = currentPage < totalPages;

  // For compatibility with keyset pagination, compute nextCursor
  const nextCursor =
    hasNext && items.length > 0 ? items[items.length - 1].id : null;

  return {
    data: items.map(transformProduct),
    nextCursor,
    hasNext,
    total,
    pageSize,
    currentPage,
    totalPages,
  };
}
