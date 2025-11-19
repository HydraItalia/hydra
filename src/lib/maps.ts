/**
 * Google Maps Deep Link Utilities
 *
 * Utilities for building Google Maps deep links for navigation.
 * No API keys required - just generates URLs that open Google Maps.
 */

/**
 * Build a Google Maps search URL for a given address
 *
 * Opens Google Maps in search mode with the provided address.
 * Works on both web and mobile (opens Maps app on mobile devices).
 *
 * @param address - The full address to search for
 * @returns The Google Maps search URL
 *
 * @example
 * ```ts
 * const url = buildMapsSearchUrl("Piazza Navona 45, 00186 Roma RM, Italy");
 * // Returns: "https://www.google.com/maps/search/?api=1&query=Piazza%20Navona%2045%2C%2000186%20Roma%20RM%2C%20Italy"
 * ```
 */
export function buildMapsSearchUrl(address: string): string {
  const query = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Build a Google Maps directions URL for a given destination
 *
 * Opens Google Maps in directions mode from the user's current location
 * to the provided destination address.
 *
 * @param address - The destination address
 * @returns The Google Maps directions URL
 *
 * @example
 * ```ts
 * const url = buildMapsDirectionsUrl("Piazza Navona 45, 00186 Roma RM, Italy");
 * // Returns: "https://www.google.com/maps/dir/?api=1&destination=Piazza%20Navona%2045%2C%2000186%20Roma%20RM%2C%20Italy"
 * ```
 */
export function buildMapsDirectionsUrl(address: string): string {
  const destination = encodeURIComponent(address);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
