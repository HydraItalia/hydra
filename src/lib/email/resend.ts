/**
 * Resend HTTP API email sender for magic link delivery.
 *
 * Uses the Resend REST API instead of SMTP to avoid connection issues
 * in serverless environments (Vercel) where outbound SMTP is unreliable.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  statusCode: number;
  message: string;
  name: string;
}

/** Minimal email format check: local@domain.tld */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Redact email for safe logging: "bre***@gm***.com" */
function redactEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return `<invalid:len=${email.length}>`;
  const [local, domain] = parts;
  const redactedLocal = local.length <= 3 ? local[0] + "***" : local.slice(0, 3) + "***";
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return `${redactedLocal}@<invalid-domain:${domain}>`;
  const redactedDomain =
    (domainParts[0].length <= 2 ? domainParts[0] : domainParts[0].slice(0, 2) + "***") +
    "." + domainParts.slice(1).join(".");
  return `${redactedLocal}@${redactedDomain}`;
}

/**
 * Send an email via the Resend HTTP API.
 *
 * Throws on any non-2xx response with status and error message (no secrets leaked).
 */
export async function sendEmailViaResend(options: SendEmailOptions): Promise<ResendSuccessResponse> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "[email] RESEND_API_KEY is not set. Cannot send email in production."
    );
  }

  const to = options.to.trim();

  // Validate email before sending — catch truncated/malformed addresses early
  if (!EMAIL_RE.test(to)) {
    console.error("[email] Invalid recipient email format", {
      redacted: redactEmail(options.to),
      length: options.to.length,
      hasAt: options.to.includes("@"),
      hasDot: options.to.includes("."),
    });
    throw new Error(
      `[email] Invalid recipient email format (redacted: ${redactEmail(options.to)}). ` +
      `Expected user@domain.tld but got a ${options.to.length}-char string.`
    );
  }

  console.log("[email] Sending via Resend HTTP API", {
    to_redacted: redactEmail(to),
    from: options.from,
    subject: options.subject,
  });

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from,
      to: [to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    // Log enough to debug without leaking secrets
    console.error("[email] Resend API error", {
      status: response.status,
      statusText: response.statusText,
      body,
    });
    throw new Error(
      `[email] Resend API returned ${response.status}: ${body}`
    );
  }

  const result: ResendSuccessResponse = JSON.parse(body);
  console.log("[email] Resend API success", { emailId: result.id });
  return result;
}
