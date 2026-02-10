import { CategoryGroupType } from "@prisma/client";
import { Market } from "./types";
import { getAllCanonicalCategories } from "./registry";

export interface CategorySuggestion {
  slug: string;
  name: string;
  group: CategoryGroupType;
  distance: number;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Suggest canonical categories for a free-text input based on fuzzy matching.
 *
 * Scores each canonical category by:
 * - Best Levenshtein distance across name + aliases
 * - Substring containment bonus (reduces effective distance)
 *
 * Returns top `limit` suggestions sorted by ascending distance.
 */
export function suggestCanonicalCategories(
  input: string,
  market: Market = "IT",
  limit: number = 5,
): CategorySuggestion[] {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return [];

  const categories = getAllCanonicalCategories(market);
  const scored: CategorySuggestion[] = [];

  for (const cat of categories) {
    const candidates = [
      cat.name.toLowerCase(),
      ...cat.aliases.map((a) => a.toLowerCase()),
    ];

    let bestDistance = Infinity;
    for (const candidate of candidates) {
      let dist = levenshtein(normalized, candidate);

      // Substring containment bonus: if input is contained in candidate or vice versa
      if (candidate.includes(normalized) || normalized.includes(candidate)) {
        dist = Math.max(0, dist - Math.floor(normalized.length / 2));
      }

      bestDistance = Math.min(bestDistance, dist);
    }

    scored.push({
      slug: cat.slug,
      name: cat.name,
      group: cat.group,
      distance: bestDistance,
    });
  }

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, limit);
}
