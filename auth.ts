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
      server: process.env.EMAIL_SERVER || 'smtp://user:pass@smtp.example.com:587',
      from: process.env.EMAIL_FROM || 'hydra@localhost.dev',
    }),
  ],
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
