import { Role } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      vendorId?: string | null
      clientId?: string | null
      agentCode?: string | null
    }
  }

  interface User {
    role: Role
    vendorId?: string | null
    clientId?: string | null
    agentCode?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    vendorId?: string | null
    clientId?: string | null
    agentCode?: string | null
  }
}
