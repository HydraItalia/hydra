/**
 * Canonical slugify for category names.
 *
 * - trim + lowercase
 * - strip accents (NFD decomposition)
 * - collapse whitespace → single hyphen
 * - strip non-alphanumeric characters except hyphens
 * - strip leading/trailing hyphens
 */
export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumerics (except space/hyphen)
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
