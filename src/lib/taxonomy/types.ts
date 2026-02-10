import { CategoryGroupType } from "@prisma/client";

export type Market = "IT";

export interface CanonicalCategory {
  /** Display name (Italian canonical form) */
  name: string;
  /** URL-safe slug used in DB */
  slug: string;
  /** Which top-level group this category belongs to */
  group: CategoryGroupType;
  /** Key used to look up images in categoryImageMap */
  imageKey: string;
  /** EN/IT aliases that should resolve to this category */
  aliases: string[];
}

export interface GroupMeta {
  /** Prisma enum value */
  key: CategoryGroupType;
  /** Human-readable label */
  label: string;
  /** Hint for which Lucide icon to render (UI maps this to a component) */
  icon: "package" | "coffee" | "wrench";
  /** Display order (lower = first) */
  order: number;
}

export interface ResolvedCategory {
  canonicalName: string;
  canonicalSlug: string;
  group: CategoryGroupType;
  imageKey: string;
  /** true when the input didn't match any known category */
  didFallback: boolean;
}
