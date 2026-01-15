/**
 * Stripe Error Classification Module (Issue #104)
 *
 * Classifies Stripe errors into transient (auto-retry) vs permanent (manual intervention)
 * and provides sanitized, PII-free error messages for storage and display.
 */

import Stripe from "stripe";

/**
 * Error classification result
 */
export type StripeErrorClassification = {
  kind: "transient" | "permanent";
  code: string;
  safeMessage: string;
  isExpiredAuthorization: boolean;
  requiresClientUpdate: boolean;
};

/**
 * Transient errors that are eligible for automatic retry
 * These are typically network/infrastructure issues that may resolve on their own
 */
const TRANSIENT_ERROR_CODES = new Set([
  "rate_limit_error",
  "api_connection_error",
  "api_error",
  "idempotency_error",
  "lock_timeout",
  "resource_missing", // PaymentIntent may have been deleted/expired, can retry with new one
]);

/**
 * Transient Stripe error types (from error.type)
 */
const TRANSIENT_ERROR_TYPES = new Set([
  "api_connection_error",
  "api_error",
  "rate_limit_error",
]);

/**
 * Permanent errors that require manual intervention
 * These cannot be resolved by retrying and need client or admin action
 * Note: This set is kept for documentation/reference purposes
 */
const _PERMANENT_ERROR_CODES = new Set([
  "card_declined",
  "insufficient_funds",
  "expired_card",
  "incorrect_cvc",
  "incorrect_number",
  "incorrect_zip",
  "processing_error",
  "charge_expired_for_capture", // Authorization expired (7-day window passed)
  "invalid_expiry_month",
  "invalid_expiry_year",
  "invalid_cvc",
  "card_not_supported",
  "currency_not_supported",
  "duplicate_transaction",
  "fraudulent",
  "lost_card",
  "stolen_card",
  "generic_decline",
  "do_not_honor",
  "transaction_not_allowed",
  "pickup_card",
  "restricted_card",
  "security_violation",
  "service_not_allowed",
  "invalid_account",
  "new_account_information_available",
  "try_again_later", // Issuer says try later, but we treat as permanent to avoid infinite retries
  "withdrawal_count_limit_exceeded",
]);

/**
 * Errors that indicate the client needs to update their payment method
 */
const REQUIRES_CLIENT_UPDATE_CODES = new Set([
  "card_declined",
  "insufficient_funds",
  "expired_card",
  "incorrect_cvc",
  "incorrect_number",
  "lost_card",
  "stolen_card",
  "fraudulent",
  "pickup_card",
  "restricted_card",
  "invalid_expiry_month",
  "invalid_expiry_year",
]);

/**
 * Errors that indicate an expired authorization
 */
const EXPIRED_AUTHORIZATION_CODES = new Set([
  "charge_expired_for_capture",
  "payment_intent_unexpected_state", // May indicate expiration
]);

/**
 * Safe, user-friendly messages for known error codes
 * These do NOT contain any PII and are safe to store in the database
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  // Card declined variants
  card_declined: "Card was declined by the issuing bank",
  generic_decline: "Card was declined",
  insufficient_funds: "Insufficient funds on the card",
  expired_card: "Card has expired",
  incorrect_cvc: "Incorrect security code (CVC)",
  incorrect_number: "Invalid card number",
  incorrect_zip: "Incorrect billing postal code",
  invalid_expiry_month: "Invalid expiration month",
  invalid_expiry_year: "Invalid expiration year",
  invalid_cvc: "Invalid security code",
  lost_card: "Card reported lost",
  stolen_card: "Card reported stolen",
  fraudulent: "Transaction flagged as potentially fraudulent",
  pickup_card: "Card cannot be used for this transaction",
  restricted_card: "Card is restricted",
  card_not_supported: "Card type not supported",

  // Authorization/capture errors
  charge_expired_for_capture: "Payment authorization has expired (7-day limit)",
  charge_already_captured: "Payment has already been captured",
  payment_intent_unexpected_state: "Payment is in an unexpected state",

  // Account/processing errors
  processing_error: "Card could not be processed",
  invalid_account: "Invalid payment account",
  currency_not_supported: "Currency not supported",
  duplicate_transaction: "Duplicate transaction detected",

  // Network/API errors (transient)
  rate_limit_error: "Too many requests, please try again",
  api_connection_error: "Network connection error",
  api_error: "Payment service temporarily unavailable",
  idempotency_error: "Duplicate request detected",
  lock_timeout: "Request timed out, please retry",
  resource_missing: "Payment resource not found",

  // Security
  security_violation: "Security check failed",
  service_not_allowed: "Service not allowed for this card",
  transaction_not_allowed: "Transaction not permitted",
  do_not_honor: "Card issuer declined the transaction",

  // Limits
  withdrawal_count_limit_exceeded: "Card withdrawal limit exceeded",
  try_again_later: "Issuer requests to try again later",
};

/**
 * Default safe message for unknown errors
 */
const DEFAULT_SAFE_MESSAGE = "Payment processing failed";

/**
 * Classify a Stripe error into transient vs permanent categories
 *
 * @param error - The error to classify (can be Stripe error or generic Error)
 * @returns Classification with kind, code, safe message, and flags
 */
export function classifyStripeError(error: unknown): StripeErrorClassification {
  // Handle Stripe errors
  if (error instanceof Stripe.errors.StripeError) {
    const code = error.code || error.type || "unknown";
    const declineCode = (error as Stripe.errors.StripeCardError).decline_code;

    // Use decline_code if available (more specific), otherwise use code
    const effectiveCode = declineCode || code;

    // Check for transient errors
    const isTransient =
      TRANSIENT_ERROR_CODES.has(effectiveCode) ||
      TRANSIENT_ERROR_TYPES.has(error.type);

    // Check for expired authorization
    const isExpiredAuthorization =
      EXPIRED_AUTHORIZATION_CODES.has(effectiveCode) ||
      Boolean(error.message?.toLowerCase().includes("expired"));

    // Check if client needs to update payment method
    const requiresClientUpdate =
      REQUIRES_CLIENT_UPDATE_CODES.has(effectiveCode) ||
      REQUIRES_CLIENT_UPDATE_CODES.has(declineCode || "");

    // Get safe message
    const safeMessage =
      SAFE_ERROR_MESSAGES[effectiveCode] ||
      SAFE_ERROR_MESSAGES[declineCode || ""] ||
      SAFE_ERROR_MESSAGES[code] ||
      DEFAULT_SAFE_MESSAGE;

    return {
      kind: isTransient && !isExpiredAuthorization ? "transient" : "permanent",
      code: effectiveCode,
      safeMessage,
      isExpiredAuthorization,
      requiresClientUpdate,
    };
  }

  // Handle network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for network-related errors
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("socket hang up")
    ) {
      return {
        kind: "transient",
        code: "network_error",
        safeMessage: "Network connection error",
        isExpiredAuthorization: false,
        requiresClientUpdate: false,
      };
    }

    // Check for timeout errors
    if (message.includes("timed out")) {
      return {
        kind: "transient",
        code: "timeout",
        safeMessage: "Request timed out",
        isExpiredAuthorization: false,
        requiresClientUpdate: false,
      };
    }
  }

  // Unknown error - treat as permanent to avoid infinite retries
  return {
    kind: "permanent",
    code: "unknown",
    safeMessage: DEFAULT_SAFE_MESSAGE,
    isExpiredAuthorization: false,
    requiresClientUpdate: false,
  };
}

/**
 * Payment retry schedule with exponential backoff
 * Returns the delay in milliseconds for the next retry attempt
 *
 * @param attemptCount - Number of attempts made (0-indexed, so 0 = first attempt)
 * @returns Delay in milliseconds, or null if max retries exceeded
 */
export function getRetryDelay(attemptCount: number): number | null {
  // Max 5 auto-retries (attempts 1-5), then manual only
  const MAX_AUTO_RETRIES = 5;

  if (attemptCount >= MAX_AUTO_RETRIES) {
    return null; // No more auto-retries
  }

  // Exponential backoff schedule (in minutes):
  // Attempt 1: 5 minutes
  // Attempt 2: 30 minutes
  // Attempt 3: 2 hours (120 minutes)
  // Attempt 4: 8 hours (480 minutes)
  // Attempt 5: 24 hours (1440 minutes)
  const RETRY_DELAYS_MINUTES = [5, 30, 120, 480, 1440];

  const delayMinutes = RETRY_DELAYS_MINUTES[attemptCount] || 1440;
  return delayMinutes * 60 * 1000; // Convert to milliseconds
}

/**
 * Calculate the next retry time based on attempt count
 *
 * @param attemptCount - Current number of attempts
 * @returns Next retry Date, or null if max retries exceeded
 */
export function calculateNextRetryAt(attemptCount: number): Date | null {
  const delayMs = getRetryDelay(attemptCount);
  if (delayMs === null) {
    return null;
  }
  return new Date(Date.now() + delayMs);
}

/**
 * Maximum number of automatic retry attempts
 */
export const MAX_RETRY_ATTEMPTS = 5;

/**
 * Authorization expiration window (7 days in milliseconds)
 * Stripe PaymentIntents with capture_method="manual" expire after 7 days
 */
export const AUTHORIZATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Calculate authorization expiration date (7 days from now)
 */
export function calculateAuthorizationExpiresAt(): Date {
  return new Date(Date.now() + AUTHORIZATION_EXPIRY_MS);
}

/**
 * Check if an authorization has expired
 *
 * @param authorizationExpiresAt - The expiration timestamp
 * @returns true if expired, false otherwise
 */
export function isAuthorizationExpired(
  authorizationExpiresAt: Date | null | undefined
): boolean {
  if (!authorizationExpiresAt) {
    return false; // No expiration set, assume not expired
  }
  return new Date() > authorizationExpiresAt;
}
