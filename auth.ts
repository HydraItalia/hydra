import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import { authConfig } from './auth.config'
import { prisma } from '@/lib/prisma'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER || 'smtp://localhost:25',
      from: process.env.EMAIL_FROM || 'hydra@localhost.dev',
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVER) {
          // In development without SMTP, just log the URL
          console.log('\n📧 Magic Link for', email)
          console.log('🔗 Click here to sign in:', url)
          console.log('\n')
          return
        }

        // Otherwise use default nodemailer
        const nodemailer = await import('nodemailer')
        const transport = nodemailer.createTransport(provider.server)
        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: 'Sign in to Hydra',
          text: `Sign in to Hydra\n\n${url}\n\n`,
          html: `<p>Click the link below to sign in:</p><p><a href="${url}">Sign in to Hydra</a></p>`,
        })
      },
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
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
          },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.vendorId = dbUser.vendorId
          token.clientId = dbUser.clientId
          token.agentCode = dbUser.agentCode
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.vendorId = token.vendorId as string | null
        session.user.clientId = token.clientId as string | null
        session.user.agentCode = token.agentCode as string | null
      }
      return session
    },
  },
})
