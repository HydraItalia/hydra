import { ReactNode } from 'react'

type Role = 'ADMIN' | 'AGENT' | 'VENDOR' | 'CLIENT'

interface RoleGateProps {
  children: ReactNode
  allowedRoles: Role[]
  userRole: Role
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on user role
 *
 * @example
 * <RoleGate allowedRoles={['ADMIN', 'AGENT']} userRole={user.role}>
 *   <AdminOnlyContent />
 * </RoleGate>
 */
export function RoleGate({
  children,
  allowedRoles,
  userRole,
  fallback = null,
}: RoleGateProps) {
  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
