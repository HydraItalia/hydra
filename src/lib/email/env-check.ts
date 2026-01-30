/**
 * Production environment validation for email configuration.
 *
 * Call this at startup / module load to fail fast if required
 * email env vars are missing in production.
 */

export function validateEmailEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    return; // Only enforce in production
  }

  // RESEND_API_KEY is required for sending emails in production
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "[email] FATAL: RESEND_API_KEY is not set in production. Magic link emails will not send."
    );
  }

  // EMAIL_FROM is required
  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "[email] FATAL: EMAIL_FROM is not set in production."
    );
  }

  // AUTH_SECRET is required by NextAuth
  if (!process.env.AUTH_SECRET) {
    throw new Error(
      "[email] FATAL: AUTH_SECRET is not set in production."
    );
  }

  // Warn if AUTH_EMAIL_DEV_MODE is set to something other than "false" in production
  const devModeVal = process.env.AUTH_EMAIL_DEV_MODE;
  if (devModeVal && devModeVal.toLowerCase() !== "false") {
    console.warn(
      `[email] WARNING: AUTH_EMAIL_DEV_MODE="${devModeVal}" in production. ` +
      `This flag is ignored in production (emails always send), but should be "false" or unset.`
    );
  }
}
