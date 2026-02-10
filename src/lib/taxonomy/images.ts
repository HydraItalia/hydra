import { Market } from "./types";
import { resolveCategory } from "./resolver";

/**
 * Given a DB category slug, return the image key used in
 * src/lib/images.ts `categoryImageMap`.
 *
 * This bridges English slugs (created by CSV import) to the Italian
 * keys that categoryImageMap uses.
 *
 * If the slug is already a valid Italian image key, it passes through.
 * Unknown slugs fall through as-is (the caller handles missing keys).
 */
export function getImageKeyForCategorySlug(
  slug: string,
  market: Market = "IT",
): string {
  const resolved = resolveCategory(slug, market);
  // If we matched a known category, use its imageKey
  if (!resolved.didFallback) {
    return resolved.imageKey;
  }
  // Unknown slug — return as-is so the caller can try the group fallback
  return slug;
}
