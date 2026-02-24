import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const scheme = process.env.MOBILE_DEEP_LINK_SCHEME || "hydramobiledriver";
  const deepLink = `${scheme}://auth?token=${encodeURIComponent(token)}`;
  const fallbackUrl =
    process.env.MOBILE_DEEP_LINK_FALLBACK_URL ||
    `${process.env.BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/mobile/auth`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${deepLink}">
  <title>Opening Hydra Driver...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f4f4f5; color: #18181b; }
    .card { text-align: center; padding: 40px; max-width: 400px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { font-size: 15px; color: #71717a; margin: 0 0 24px; line-height: 1.5; }
    a.btn { display: inline-block; padding: 12px 24px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    a.btn:hover { background: #b91c1c; }
    .fallback { margin-top: 24px; font-size: 13px; color: #a1a1aa; }
    .fallback a { color: #dc2626; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Opening Hydra Driver...</h1>
    <p>If the app didn't open automatically, tap the button below.</p>
    <a class="btn" href="${deepLink}">Open Hydra Driver</a>
    <div class="fallback">
      <p>App not installed? <a href="${fallbackUrl}">Continue in browser</a></p>
    </div>
  </div>
  <script>window.location.href = ${JSON.stringify(deepLink)};</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
