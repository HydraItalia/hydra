import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Warehouse,
  GitBranch,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

type Role = 'ADMIN' | 'AGENT' | 'VENDOR' | 'CLIENT'

/**
 * Get navigation items based on user role
 */
export function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case 'ADMIN':
    case 'AGENT':
      return [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Vendors',
          href: '/dashboard/vendors',
          icon: Store,
        },
        {
          label: 'Clients',
          href: '/dashboard/clients',
          icon: Users,
        },
        {
          label: 'Catalog',
          href: '/dashboard/catalog',
          icon: Package,
        },
        {
          label: 'Orders',
          href: '/dashboard/orders',
          icon: ShoppingCart,
        },
        {
          label: 'Smistamento Ordini',
          href: '/dashboard/routing',
          icon: GitBranch,
        },
        {
          label: 'Reports',
          href: '/dashboard/reports',
          icon: BarChart3,
        },
      ]

    case 'VENDOR':
      return [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'My Inventory',
          href: '/dashboard/inventory',
          icon: Warehouse,
        },
        {
          label: 'Orders',
          href: '/dashboard/orders',
          icon: ShoppingCart,
        },
      ]

    case 'CLIENT':
      return [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Catalog',
          href: '/dashboard/catalog',
          icon: Package,
        },
        {
          label: 'My Cart',
          href: '/dashboard/cart',
          icon: ShoppingCart,
        },
        {
          label: 'Orders',
          href: '/dashboard/orders',
          icon: FileText,
        },
      ]

    default:
      return []
  }
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  if (email) {
    return email.slice(0, 2).toUpperCase()
  }

  return 'U'
}

/**
 * Get role display name
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    ADMIN: 'Administrator',
    AGENT: 'Agent',
    VENDOR: 'Vendor',
    CLIENT: 'Client',
  }
  return labels[role]
}
