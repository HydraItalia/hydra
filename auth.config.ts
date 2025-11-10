import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnSignIn = nextUrl.pathname.startsWith('/signin')

      if (isOnSignIn) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }

      return isLoggedIn || nextUrl.pathname === '/'
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
