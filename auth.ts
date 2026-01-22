import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import { isDemoModeEnabled, DEMO_USERS } from "@/lib/demo-mode";

/**
 * NextAuth Configuration for Hydra
 *
 * Email Authentication:
 * - AUTH_EMAIL_DEV_MODE not set or "true" (default): Magic links are logged to terminal only
 * - AUTH_EMAIL_DEV_MODE="false" (case-insensitive): Magic links are logged AND sent via EMAIL_SERVER
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
                (u) => u.email === credentials.email
              );
              if (!demoUser) {
                console.warn(
                  `[Demo Mode] Attempted signin with unauthorized email`
                );
                return null;
              }

              // Find user in database
              const user = await prisma.user.findUnique({
                where: { email: credentials.email as string },
              });

              if (!user) {
                console.error(
                  `[Demo Mode] User not found in database: ${credentials.email}`
                );
                return null;
              }

              console.log(
                `[Demo Mode] Signing in with role: ${user.role}`
              );

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
            },
          }),
        ]
      : []),

    // Email Provider (magic links)
    EmailProvider({
      server: process.env.EMAIL_SERVER || "smtp://localhost:25",
      from: process.env.EMAIL_FROM || "hydra@localhost.dev",
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        // Check if dev mode is enabled (non-production only)
        // Defaults to true if not set or if explicitly "true"
        // Only when explicitly set to "false" (case-insensitive) will emails be sent in dev
        const isDevMode =
          process.env.NODE_ENV !== "production" &&
          process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false";

        // Always log the magic link in development for debugging
        if (isDevMode) {
          console.log("\n📧 Magic Link for", email);
          console.log("🔗 Click here to sign in:", url);
          console.log("\n");
        }

        // If dev mode is enabled, only log (don't send email)
        if (isDevMode) {
          return;
        }

        // Production mode: send actual email
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport(provider.server);
        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: "Sign in to Hydra",
          text: `Sign in to Hydra\n\n${url}\n\n`,
          html: `<p>Click the link below to sign in:</p><p><a href="${url}">Sign in to Hydra</a></p>`,
        });
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fetch the full user with role information
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            vendorId: true,
            clientId: true,
            agentCode: true,
            driverId: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.vendorId = dbUser.vendorId;
          token.clientId = dbUser.clientId;
          token.agentCode = dbUser.agentCode;
          token.driverId = dbUser.driverId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.vendorId = token.vendorId as string | null;
        session.user.clientId = token.clientId as string | null;
        session.user.agentCode = token.agentCode as string | null;
        session.user.driverId = token.driverId as string | null;
      }
      return session;
    },
  },
});
