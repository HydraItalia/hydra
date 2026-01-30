/**
 * Smoke test: send a test email via Resend HTTP API.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx EMAIL_FROM=you@domain.com npx tsx scripts/test-magic-link-email.ts test@example.com
 *
 * This runs locally — NOT on Vercel. For Vercel testing, use the
 * /api/debug/email route with CRON_SECRET auth.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

async function main() {
  const to = process.argv[2];
  if (!to || !to.includes("@")) {
    console.error("Usage: npx tsx scripts/test-magic-link-email.ts <email>");
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("ERROR: RESEND_API_KEY env var is required");
    process.exit(1);
  }

  const from = process.env.EMAIL_FROM || "hydra@localhost.dev";

  console.log(`Sending test email to ${to} from ${from}...`);

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "[Hydra] Magic link email smoke test",
      text: "This is a smoke test. If you see this, Resend HTTP API is working.",
      html: "<p>This is a smoke test. If you see this, <strong>Resend HTTP API</strong> is working.</p>",
    }),
  });

  const body = await res.text();
  console.log(`Status: ${res.status} ${res.statusText}`);
  console.log(`Response: ${body}`);

  if (!res.ok) {
    console.error("FAILED — see response above");
    process.exit(1);
  }

  console.log("SUCCESS — email sent");
}

main();
