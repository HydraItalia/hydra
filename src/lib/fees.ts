/**
 * Hydra Platform Fee Helpers (N2.1)
 *
 * All amounts are in cents (integers). Fee rates use basis points (bps):
 * - 500 bps = 5.00%
 * - 250 bps = 2.50%
 * - 0 bps = 0.00% (no fee)
 *
 * NO FLOATS for fee math. All calculations use integers with rounding.
 */

/** Default Hydra platform fee in basis points (500 = 5.00%) */
export const DEFAULT_HYDRA_FEE_BPS = 500;

/** Maximum reasonable fee in basis points (10000 = 100%) */
export const MAX_REASONABLE_FEE_BPS = 10000;

/**
 * Parse HYDRA_FEE_BPS environment variable.
 *
 * @param envValue - The raw environment variable value (may be undefined or invalid)
 * @param fallback - Fallback value if envValue is missing or invalid (default: 500)
 * @returns The fee rate in basis points (integer >= 0)
 */
export function parseHydraFeeBps(
  envValue?: string,
  fallback: number = DEFAULT_HYDRA_FEE_BPS,
): number {
  // If no value provided, use fallback
  if (envValue === undefined || envValue === "") {
    return fallback;
  }

  // Parse as integer
  const parsed = parseInt(envValue, 10);

  // If parsing failed (NaN), negative, or exceeds max, use fallback
  if (Number.isNaN(parsed) || parsed < 0 || parsed > MAX_REASONABLE_FEE_BPS) {
    return fallback;
  }

  return parsed;
}

/**
 * Compute Hydra platform fee in cents from a gross amount.
 *
 * Formula: feeCents = Math.round(grossCents * feeBps / 10000)
 *
 * @param grossCents - The gross amount to calculate fee on (in cents)
 * @param feeBps - The fee rate in basis points (e.g., 500 for 5%)
 * @returns The fee amount in cents
 * @throws Error if grossCents < 0 or feeBps < 0
 */
export function computeHydraFeeCents(
  grossCents: number,
  feeBps: number,
): number {
  if (grossCents < 0) {
    throw new Error("grossCents cannot be negative");
  }
  if (!Number.isInteger(grossCents)) {
    throw new Error("grossCents must be an integer");
  }
  if (feeBps < 0) {
    throw new Error("feeBps cannot be negative");
  }
  if (!Number.isInteger(feeBps)) {
    throw new Error("feeBps must be an integer");
  }

  // Handle 0% fee
  if (feeBps === 0) {
    return 0;
  }

  // fee = gross * bps / 10000, rounded to nearest cent
  return Math.round((grossCents * feeBps) / 10000);
}

/**
 * Convert basis points to decimal percentage.
 *
 * @param bps - Basis points (e.g., 500)
 * @returns Decimal percentage (e.g., 0.05 for 5%)
 */
export function bpsToPercent(bps: number): number {
  return bps / 10000;
}
