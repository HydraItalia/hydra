import { Role, UserStatus } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
      status: UserStatus;
      vendorId?: string | null;
      clientId?: string | null;
      agentId?: string | null;
      agentCode?: string | null;
      driverId?: string | null;
    };
  }

  interface User {
    role: Role;
    status: UserStatus;
    vendorId?: string | null;
    clientId?: string | null;
    agentId?: string | null;
    agentCode?: string | null;
    driverId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
    vendorId?: string | null;
    clientId?: string | null;
    agentId?: string | null;
    agentCode?: string | null;
    driverId?: string | null;
  }
}
