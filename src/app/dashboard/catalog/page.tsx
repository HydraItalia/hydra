import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePriceCents } from "@/lib/pricing";
import { getCategoryGroups } from "@/lib/loaders/categories";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar";
import { ProductGridWithDrawer } from "@/components/catalog/product-grid-with-drawer";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { EmptyState } from "@/components/catalog/empty-state";
import { CategoryGroupType, ProductUnit } from "@prisma/client";
import { parseBoolParam } from "@/lib/url";

type SearchParams = {
  group?: string;
  category?: string;
  q?: string;
  inStock?: string;
};

type ProductResult = {
  productId: string;
  productName: string;
  unit: ProductUnit;
  categorySlug: string;
  bestOffer?: {
    vendorId: string;
    vendorName: string;
    priceCents: number;
    inStock: boolean;
    leadTimeDays: number | null;
  };
  offersCount: number;
};

async function getAvailability(stockQty: number, leadTimeDays: number | null) {
  return {
    inStock: stockQty > 0,
    leadTimeDays: stockQty > 0 ? 0 : leadTimeDays,
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin");
  }

  // Only CLIENT role can access catalog
  if (user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  if (!user.clientId) {
    redirect("/dashboard");
  }

  // Parse search params (await in Next.js 15)
  const params = await searchParams;
  const groupParam = (
    params.group || "food"
  ).toUpperCase() as CategoryGroupType;
  const categorySlug = params.category;
  const searchQuery = params.q;
  // Parse inStock from URL (1 = true, absent = false)
  const searchParamsObj = new URLSearchParams();
  if (params.inStock) searchParamsObj.set("inStock", params.inStock);
  const inStockOnly = parseBoolParam(searchParamsObj, "inStock");

  // Validate group
  const validGroups: CategoryGroupType[] = ["FOOD", "BEVERAGE", "SERVICES"];
  const selectedGroup = validGroups.includes(groupParam) ? groupParam : "FOOD";

  // Fetch category groups and categories (cached)
  const categoryGroups = await getCategoryGroups();

  const currentGroup = categoryGroups.find((g) => g.name === selectedGroup);
  const categories = currentGroup?.categories || [];

  // Build product query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productWhere: any = {
    deletedAt: null,
    category: {
      group: { name: selectedGroup },
      ...(categorySlug && { slug: categorySlug }),
    },
  };

  if (searchQuery) {
    productWhere.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Fetch products with vendor products
  const products = await prisma.product.findMany({
    where: productWhere,
    include: {
      category: {
        select: { slug: true, name: true },
      },
      vendorProducts: {
        where: {
          isActive: true,
          deletedAt: null,
          ...(inStockOnly ? { stockQty: { gt: 0 } } : {}),
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Build ProductResult array with pricing and offers map
  const productResults: ProductResult[] = [];
  const productOffersMap: Record<string, any[]> = {};

  for (const product of products) {
    if (product.vendorProducts.length === 0) continue;

    // Calculate offers for each vendor product
    const offers = await Promise.all(
      product.vendorProducts.map(async (vp) => {
        const priceCents = await getEffectivePriceCents({
          clientId: user.clientId!,
          vendorProductId: vp.id,
        });

        const availability = await getAvailability(
          vp.stockQty,
          vp.leadTimeDays
        );

        return {
          vendorId: vp.vendor.id,
          vendorName: vp.vendor.name,
          priceCents,
          inStock: availability.inStock,
          leadTimeDays: availability.leadTimeDays,
        };
      })
    );

    // Store all offers for this product
    productOffersMap[product.id] = offers;

    // Find best offer (lowest price, prefer in-stock)
    const inStockOffers = offers.filter((o) => o.inStock);
    const outOfStockOffers = offers.filter((o) => !o.inStock);

    let bestOffer = undefined;

    if (inStockOffers.length > 0) {
      // Choose lowest price among in-stock offers
      bestOffer = inStockOffers.reduce((best, current) =>
        current.priceCents < best.priceCents ? current : best
      );
    } else if (outOfStockOffers.length > 0) {
      // Choose shortest lead time among out-of-stock offers
      bestOffer = outOfStockOffers.reduce((best, current) => {
        if (current.leadTimeDays === null) return best;
        if (best.leadTimeDays === null) return current;
        return current.leadTimeDays < best.leadTimeDays ? current : best;
      });
    }

    productResults.push({
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      categorySlug: product.category.slug,
      bestOffer,
      offersCount: offers.length,
    });
  }

  // Check if any filters are active
  const hasActiveFilters = !!(searchQuery || inStockOnly || categorySlug);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        subtitle={`Browse ${selectedGroup.toLowerCase()} products from all vendors`}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <CatalogSidebar
            categoryGroups={categoryGroups}
            selectedGroup={selectedGroup}
            selectedCategory={categorySlug}
            categories={categories}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Filters */}
          <CatalogFilters
            initial={{
              group: selectedGroup.toLowerCase() as
                | "food"
                | "beverage"
                | "services",
              category: categorySlug,
              q: searchQuery,
              inStock: inStockOnly,
            }}
          />

          {/* Product Grid */}
          <Suspense fallback={<CatalogSkeleton />}>
            {productResults.length > 0 ? (
              <ProductGridWithDrawer
                products={productResults}
                productOffersMap={productOffersMap}
              />
            ) : (
              <EmptyState hasActiveFilters={hasActiveFilters} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
