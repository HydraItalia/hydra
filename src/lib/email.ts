import { formatCurrency } from "./utils";

/**
 * Email Utility Module for Hydra
 *
 * Handles order confirmation emails with dev-mode logging support.
 * Uses AUTH_EMAIL_DEV_MODE to control email behavior:
 * - "true" (default): Log emails to console only
 * - "false": Ready for real email provider integration
 */

export type OrderEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type OrderItemForEmail = {
  productName: string;
  vendorName: string;
  quantity: number;
  priceCents: number;
};

/**
 * Builds an order confirmation email payload
 *
 * @param args Order details for email generation
 * @returns Complete email payload with subject, text, and HTML versions
 */
export function buildOrderConfirmationEmail(args: {
  orderNumber: string;
  createdAt: Date;
  totalCents: number;
  clientEmail: string;
  clientName?: string | null;
  items: OrderItemForEmail[];
}): OrderEmailPayload {
  const { orderNumber, createdAt, totalCents, clientEmail, clientName, items } =
    args;

  // Format date in Italian locale
  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(createdAt);

  // Build subject
  const subject = `Conferma Ordine Hydra – ${orderNumber}`;

  // Build text version
  const textLines: string[] = [
    `CONFERMA ORDINE HYDRA`,
    ``,
    `Gentile ${clientName || "Cliente"},`,
    ``,
    `Il tuo ordine è stato confermato con successo!`,
    ``,
    `Numero Ordine: ${orderNumber}`,
    `Data: ${formattedDate}`,
    ``,
    `ARTICOLI ORDINATI:`,
    ``,
  ];

  items.forEach((item) => {
    const lineTotal = item.quantity * item.priceCents;
    textLines.push(
      `${item.productName} × ${item.quantity} – ${item.vendorName} – ${formatCurrency(item.priceCents)} = ${formatCurrency(lineTotal)}`
    );
  });

  textLines.push(
    ``,
    `TOTALE ORDINE: ${formatCurrency(totalCents)}`,
    ``,
    `Grazie per il tuo ordine!`,
    `Il nostro team lo processerà a breve e riceverai ulteriori aggiornamenti.`,
    ``,
    `Cordiali saluti,`,
    `Il team Hydra`,
    ``,
    `---`,
    `Questo è un ordine generato da Hydra.`
  );

  const text = textLines.join("\n");

  // Build HTML version
  const itemsHtml = items
    .map((item) => {
      const lineTotal = item.quantity * item.priceCents;
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${item.vendorName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.priceCents)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma Ordine</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">HYDRA</h1>
      <p style="margin: 8px 0 0 0; color: #fecaca; font-size: 14px;">B2B Restaurant Procurement</p>
    </div>

    <!-- Order Confirmed Banner -->
    <div style="background-color: #dcfce7; border-bottom: 3px solid #22c55e; padding: 20px 24px;">
      <h2 style="margin: 0; color: #15803d; font-size: 20px; font-weight: 600;">✓ Ordine Confermato</h2>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 24px 0; font-size: 16px;">Gentile <strong>${clientName || "Cliente"}</strong>,</p>
      <p style="margin: 0 0 24px 0; font-size: 16px;">Il tuo ordine è stato confermato con successo!</p>

      <!-- Order Info -->
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">Numero Ordine</span>
          <div style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; color: #dc2626; margin-top: 4px;">${orderNumber}</div>
        </div>
        <div>
          <span style="color: #6b7280; font-size: 14px;">Data Ordine</span>
          <div style="font-size: 16px; margin-top: 4px;">${formattedDate}</div>
        </div>
      </div>

      <!-- Order Items Table -->
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Articoli Ordinati</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Prodotto</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Fornitore</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Qtà</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Prezzo</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Totale</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Order Total -->
      <div style="text-align: right; padding: 16px 0; border-top: 2px solid #e5e7eb;">
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Totale Ordine</div>
        <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${formatCurrency(totalCents)}</div>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.6;">
        Grazie per il tuo ordine! Il nostro team lo processerà a breve e riceverai ulteriori aggiornamenti sullo stato di avanzamento.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        Cordiali saluti,<br>
        <strong>Il team Hydra</strong>
      </p>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
        Questo è un ordine generato da Hydra.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    to: clientEmail,
    subject,
    text,
    html,
  };
}

/**
 * Sends an order confirmation email
 *
 * Behavior based on AUTH_EMAIL_DEV_MODE:
 * - "true" or NODE_ENV=development: Log to console only
 * - "false": Log to console with TODO for real provider integration
 *
 * This function never throws - email sending is best-effort.
 *
 * @param payload The email payload to send
 */
export async function sendOrderConfirmationEmail(
  payload: OrderEmailPayload
): Promise<void> {
  try {
    // Check if dev mode is enabled
    // Defaults to true if not set or if NODE_ENV is development
    const isDevMode =
      process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false" ||
      process.env.NODE_ENV === "development";

    // Always log in dev mode for debugging
    if (isDevMode) {
      console.log("\n" + "=".repeat(80));
      console.log("📧 [Hydra EMAIL DEV MODE] Order Confirmation Email");
      console.log("=".repeat(80));
      console.log(`To: ${payload.to}`);
      console.log(`Subject: ${payload.subject}`);
      console.log("-".repeat(80));
      console.log("Text Version:");
      console.log("-".repeat(80));
      console.log(payload.text);
      console.log("=".repeat(80));
      console.log(
        "ℹ️  Email logged to console only (AUTH_EMAIL_DEV_MODE=true)"
      );
      console.log("=".repeat(80) + "\n");
      return;
    }

    // Production mode preparation
    console.log("\n" + "=".repeat(80));
    console.log("📧 [Hydra EMAIL] Order Confirmation Email");
    console.log("=".repeat(80));
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log("-".repeat(80));

    // TODO: Integrate with real email provider (Resend/Postmark/SMTP) in Phase 6.x
    // Example integration points:
    //
    // Option 1: Resend
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: process.env.EMAIL_FROM || 'noreply@hydra.example.com',
    //   to: payload.to,
    //   subject: payload.subject,
    //   text: payload.text,
    //   html: payload.html,
    // });
    //
    // Option 2: Nodemailer (SMTP)
    // const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to: payload.to,
    //   subject: payload.subject,
    //   text: payload.text,
    //   html: payload.html,
    // });

    console.log(
      "⚠️  TODO: Real email provider integration not yet implemented"
    );
    console.log("Email payload ready but not sent (logging only for now)");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    // Never throw - email is best-effort
    // Log error but don't impact order creation
    console.error(
      "[Hydra] Failed to send order confirmation email:",
      error instanceof Error ? error.message : error
    );
  }
}
