import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CategoryGroupType } from "@prisma/client";

/**
 * Get all category groups with their categories (cached)
 * Revalidates every 60 seconds
 */
export const getCategoryGroups = unstable_cache(
  async () => {
    return prisma.categoryGroup.findMany({
      include: {
        ProductCategory: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  },
  ["category-groups"],
  { revalidate: 60 }
);

/**
 * Get categories by group (cached)
 * Revalidates every 60 seconds
 */
export const getCategoriesByGroup = unstable_cache(
  async (group: CategoryGroupType) => {
    return prisma.productCategory.findMany({
      where: { CategoryGroup: { name: group } },
      orderBy: { name: "asc" },
    });
  },
  ["categories"],
  { revalidate: 60 }
);
