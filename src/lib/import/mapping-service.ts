import { prisma } from "@/lib/prisma";
import { resolveCategory } from "@/lib/taxonomy";

export interface VendorMappingItem {
  id: string;
  rawCategory: string;
  canonicalSlug: string;
  canonicalName: string;
  canonicalGroup: string;
  createdAt: string;
}

/**
 * List all vendor category mappings, enriched with canonical name/group.
 */
export async function listVendorMappings(
  vendorId: string,
): Promise<VendorMappingItem[]> {
  const mappings = await prisma.vendorCategoryMapping.findMany({
    where: { vendorId },
    orderBy: { rawCategory: "asc" },
  });

  return mappings.map((m) => {
    const resolved = resolveCategory(m.canonicalSlug, "IT");
    return {
      id: m.id,
      rawCategory: m.rawCategory,
      canonicalSlug: m.canonicalSlug,
      canonicalName: resolved.canonicalName,
      canonicalGroup: resolved.group,
      createdAt: m.createdAt.toISOString(),
    };
  });
}

/**
 * Upsert a vendor category mapping.
 * Validates that the canonical slug is a known canonical category.
 */
export async function upsertVendorMapping(
  vendorId: string,
  rawCategory: string,
  canonicalSlug: string,
): Promise<VendorMappingItem> {
  // Validate that the slug is canonical (not a fallback)
  const resolved = resolveCategory(canonicalSlug, "IT");
  if (resolved.didFallback) {
    throw new Error(
      `"${canonicalSlug}" is not a recognized canonical category slug`,
    );
  }

  const key = rawCategory.trim().toLowerCase();
  if (!key) {
    throw new Error("rawCategory cannot be empty");
  }

  const mapping = await prisma.vendorCategoryMapping.upsert({
    where: {
      vendorId_rawCategory: { vendorId, rawCategory: key },
    },
    update: { canonicalSlug: resolved.canonicalSlug },
    create: {
      vendorId,
      rawCategory: key,
      canonicalSlug: resolved.canonicalSlug,
    },
  });

  return {
    id: mapping.id,
    rawCategory: mapping.rawCategory,
    canonicalSlug: mapping.canonicalSlug,
    canonicalName: resolved.canonicalName,
    canonicalGroup: resolved.group,
    createdAt: mapping.createdAt.toISOString(),
  };
}

/**
 * Delete a vendor category mapping by composite key.
 */
export async function deleteVendorMapping(
  vendorId: string,
  rawCategory: string,
): Promise<void> {
  const key = rawCategory.trim().toLowerCase();
  await prisma.vendorCategoryMapping.delete({
    where: {
      vendorId_rawCategory: { vendorId, rawCategory: key },
    },
  });
}
