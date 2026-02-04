import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import { isDemoModeEnabled, DEMO_USERS } from "@/lib/demo-mode";
import { sendEmailViaResend } from "@/lib/email/resend";
import { validateEmailEnv } from "@/lib/email/env-check";

// Fail fast in production if email env vars are missing
validateEmailEnv();

/**
 * NextAuth Configuration for Hydra
 *
 * Email Authentication:
 * - Production: Magic links are sent via Resend HTTP API (RESEND_API_KEY)
 * - Development (default): Magic links are logged to terminal only
 * - Development with AUTH_EMAIL_DEV_MODE="false": Magic links are sent via Resend HTTP API
 *
 * Demo Mode (when ENABLE_DEMO_MODE="true"):
 * - Adds Credentials provider for one-click demo user signin
 * - Only works with emails in DEMO_USERS list
 * - Bypasses email verification for fast testing/demos
 *
 * All user roles (ADMIN, AGENT, VENDOR, CLIENT, DRIVER) can sign in.
 * Role-specific access is controlled by RoleGate components and auth callbacks.
 */

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    // Demo Mode Credentials Provider (only when ENABLE_DEMO_MODE=true)
    ...(isDemoModeEnabled()
      ? [
          CredentialsProvider({
            id: "demo",
            name: "Demo User",
            credentials: {
              email: { label: "Email", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.email) {
                return null;
              }

              // Check if email is in demo users list
              const demoUser = DEMO_USERS.find(
                (u) => u.email === credentials.email,
              );
              if (!demoUser) {
                console.warn(
                  `[Demo Mode] Attempted signin with unauthorized email`,
                );
                return null;
              }

              // Find user in database
              const user = await prisma.user.findUnique({
                where: { email: credentials.email as string },
              });

              if (!user) {
                console.error(
                  `[Demo Mode] User not found in database: ${credentials.email}`,
                );
                return null;
              }

              console.log(`[Demo Mode] Signing in with role: ${user.role}`);

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
              };
            },
          }),
        ]
      : []),

    // Email Provider (magic links)
    // Uses Resend HTTP API in production (SMTP is unreliable in Vercel serverless).
    EmailProvider({
      // server is still required by the provider type but unused in our custom sender
      server: process.env.EMAIL_SERVER || "smtp://localhost:25",
      from: process.env.EMAIL_FROM || "hydra@localhost.dev",
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        // Check if dev mode is enabled (non-production only)
        // Defaults to true if not set or if explicitly "true"
        // Only when explicitly set to "false" (case-insensitive) will emails be sent in dev
        const isDevMode =
          process.env.NODE_ENV !== "production" &&
          process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false";

        // Safe redacted preview: "bre***@gm***.com"
        const parts = email.split("@");
        const hasValidShape = parts.length === 2 && parts[1].includes(".");
        const redactedPreview = hasValidShape
          ? `${parts[0].slice(0, 3)}***@${parts[1]}`
          : `<invalid:len=${email.length},hasAt=${email.includes("@")}>`;

        // Structured logging for debugging (safe - no full email)
        console.log("[auth] sendVerificationRequest invoked", {
          nodeEnv: process.env.NODE_ENV,
          authEmailDevMode: process.env.AUTH_EMAIL_DEV_MODE ?? "(unset)",
          isDevMode,
          recipientPreview: redactedPreview,
          recipientLength: email.length,
          from: provider.from,
          hasResendApiKey: !!process.env.RESEND_API_KEY,
        });

        // Dev mode: log magic link to console and skip sending
        if (isDevMode) {
          console.log("\n📧 Magic Link for", email);
          console.log("🔗 Click here to sign in:", url);
          console.log("[auth] Dev mode active — email NOT sent\n");
          return;
        }

        // Production / real-send mode: use Resend HTTP API
        console.log("[auth] Sending magic link email via Resend HTTP API");

        const subject = "Sign in to Hydra";
        const text = `Sign in to Hydra\n\n${url}\n\n`;
        const html = `<p>Click the link below to sign in:</p><p><a href="${url}">Sign in to Hydra</a></p>`;

        await sendEmailViaResend({
          to: email,
          from: provider.from as string,
          subject,
          html,
          text,
        });

        console.log("[auth] Magic link email sent successfully");
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update") {
        // Fetch the full user with role information
        // Runs on sign-in (user present) and when session.update() is called
        const dbUser = await prisma.user.findUnique({
          where: { id: (user?.id ?? token.id) as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            vendorId: true,
            clientId: true,
            agentCode: true,
            driverId: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.vendorId = dbUser.vendorId;
          token.clientId = dbUser.clientId;
          token.agentCode = dbUser.agentCode;
          token.driverId = dbUser.driverId;
        } else {
          // New user just created by adapter — default to ONBOARDING
          token.status = "ONBOARDING";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.status = token.status as any;
        session.user.vendorId = token.vendorId as string | null;
        session.user.clientId = token.clientId as string | null;
        session.user.agentCode = token.agentCode as string | null;
        session.user.driverId = token.driverId as string | null;
      }
      return session;
    },
  },
});
