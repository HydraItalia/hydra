import { CategoryGroupType } from "@prisma/client";
import { CanonicalCategory, Market, ResolvedCategory } from "./types";
import { IT_CATEGORIES } from "./registry.it";
import { slugifyCategory } from "./slug";

/** Map of market → registry (only IT for now) */
const registries: Record<Market, CanonicalCategory[]> = {
  IT: IT_CATEGORIES,
};

/**
 * Build lookup indices for a market's registry.
 * Built once on first access and cached in module scope.
 */
function buildIndex(categories: CanonicalCategory[]) {
  /** alias (lowercased) → CanonicalCategory */
  const byAlias = new Map<string, CanonicalCategory>();
  /** slug → CanonicalCategory */
  const bySlug = new Map<string, CanonicalCategory>();

  for (const cat of categories) {
    bySlug.set(cat.slug, cat);
    for (const alias of cat.aliases) {
      byAlias.set(alias.toLowerCase(), cat);
    }
    // also index by slug and lowercased name
    byAlias.set(cat.slug, cat);
    byAlias.set(cat.name.toLowerCase(), cat);
  }

  return { byAlias, bySlug };
}

const indexCache = new Map<Market, ReturnType<typeof buildIndex>>();

function getIndex(market: Market) {
  let idx = indexCache.get(market);
  if (!idx) {
    idx = buildIndex(registries[market]);
    indexCache.set(market, idx);
  }
  return idx;
}

/**
 * Resolve a free-text category input to a canonical category.
 *
 * Lookup order:
 * 1. Exact alias match (lowercased input)
 * 2. Slugified input matches a known slug
 * 3. Slugified input matches an alias
 * 4. Fallback: slugify input, default group FOOD, didFallback = true
 */
export function resolveCategory(
  input: string,
  market: Market = "IT",
): ResolvedCategory {
  const { byAlias, bySlug } = getIndex(market);
  const normalized = input.trim().toLowerCase();

  // 1. Direct alias match
  const byAliasMatch = byAlias.get(normalized);
  if (byAliasMatch) {
    return {
      canonicalName: byAliasMatch.name,
      canonicalSlug: byAliasMatch.slug,
      group: byAliasMatch.group,
      imageKey: byAliasMatch.imageKey,
      didFallback: false,
    };
  }

  // 2. Slugified input matches a known slug
  const slug = slugifyCategory(input);
  const bySlugMatch = bySlug.get(slug);
  if (bySlugMatch) {
    return {
      canonicalName: bySlugMatch.name,
      canonicalSlug: bySlugMatch.slug,
      group: bySlugMatch.group,
      imageKey: bySlugMatch.imageKey,
      didFallback: false,
    };
  }

  // 3. Slugified input matches an alias
  const bySlugAlias = byAlias.get(slug);
  if (bySlugAlias) {
    return {
      canonicalName: bySlugAlias.name,
      canonicalSlug: bySlugAlias.slug,
      group: bySlugAlias.group,
      imageKey: bySlugAlias.imageKey,
      didFallback: false,
    };
  }

  // 4. Fallback — unknown category
  return {
    canonicalName: input.trim(),
    canonicalSlug: slug,
    group: "FOOD",
    imageKey: slug,
    didFallback: true,
  };
}

/**
 * Look up the CategoryGroupType for a category name or slug.
 * Convenience wrapper around resolveCategory.
 */
export function getCategoryGroupByNameOrSlug(
  input: string,
  market: Market = "IT",
): CategoryGroupType {
  return resolveCategory(input, market).group;
}
