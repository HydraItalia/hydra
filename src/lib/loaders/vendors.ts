import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Get all vendors (cached)
 * Revalidates every 60 seconds
 * Note: This is used internally for backend logic, price comparisons, and ProductDrawer
 * It is NOT exposed to the client-facing filter UI
 */
export const getVendors = unstable_cache(
  async () => {
    return prisma.vendor.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { name: "asc" },
    });
  },
  ["vendors"],
  { revalidate: 60 }
);
