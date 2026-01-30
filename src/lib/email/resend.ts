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

  console.log("[email] Sending via Resend HTTP API", {
    to_domain: options.to.split("@")[1] || "unknown",
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
      to: [options.to],
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
