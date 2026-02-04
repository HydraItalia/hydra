export function magicLinkEmail({ url }: { url: string }): {
  html: string;
  text: string;
} {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td align="center" style="padding:32px 40px 24px;">
            <img src="https://hydra-multiservice.com/hydra-logo-multiservice.png" alt="Hydra" height="48" style="max-height:48px;width:auto;display:block;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:0 40px 32px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;text-align:center;">Sign in to Hydra</h1>
            <p style="margin:0 0 28px;font-size:16px;line-height:24px;color:#3f3f46;text-align:center;">Click the button below to sign in to your account.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;background-color:#dc2626;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:6px;">Sign in</a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#a1a1aa;text-align:center;word-break:break-all;">${url}</p>
            <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#71717a;text-align:center;">This link expires in 24 hours and can only be used once.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e4e4e7;">
            <p style="margin:0 0 4px;font-size:12px;line-height:18px;color:#a1a1aa;text-align:center;">If you didn't request this email, you can safely ignore it.</p>
            <p style="margin:0;font-size:12px;line-height:18px;color:#a1a1aa;text-align:center;">Hydra &mdash; Restaurant Supply Procurement</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = `Sign in to Hydra

Click the link below to sign in to your account:
${url}

This link expires in 24 hours and can only be used once.
If you didn't request this email, you can safely ignore it.

— Hydra · Restaurant Supply Procurement`;

  return { html, text };
}
