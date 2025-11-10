# ChatGPT Briefing - Hydra Project

**Quick Context for AI Assistant**

---

## What We've Built

Hydra is a **restaurant supply procurement platform** for the HORECA sector. Think of it as a B2B marketplace connecting restaurants with food/beverage suppliers.

### Current State: ✅ Phase 1-3 Complete

**What's Working**:
- ✅ Full authentication with email magic links
- ✅ Role-based access control (ADMIN, AGENT, VENDOR, CLIENT)
- ✅ Responsive dashboard with dark mode
- ✅ Complete database schema (15+ tables)
- ✅ Neon PostgreSQL fully seeded with demo data
- ✅ 44 passing tests (100% coverage)
- ✅ GitHub repo: HydraItalia/hydra

**Tech Stack**:
- Next.js 15 + React 19 + TypeScript
- Prisma ORM + Neon Postgres
- NextAuth v5 (JWT sessions)
- Tailwind + shadcn/ui
- Dark mode by default

---

## Database is Seeded With:

- **6 Users**: 1 admin, 2 agents, 2 vendors, 1 client
- **3 Vendors**: Freezco, Ghiaccio Facile, Il Gigante del Ghiaccio
- **16 Categories**: Food, beverages, services (ice, gelato, etc.)
- **8 Products**: Prosciutto, salmon, cheese, wine, gelato, ice, etc.
- **7 Vendor Products**: SKUs with different pricing
- **1 Agreement**: Demo Restaurant ↔ Freezco (10% discount)
- **1 Demo Order**: Submitted order with 3 items

---

## Key Business Logic Already Implemented

### Pricing System (3 Modes)
Each client-vendor agreement can use one of:
1. **BASE** - Use vendor's base price
2. **DISCOUNT** - Apply percentage discount (e.g., 10% off)
3. **OVERRIDE** - Use fixed price regardless of base

Function: `getEffectivePriceCents()` in `src/lib/pricing.ts`

### User Roles & Permissions
- **ADMIN/AGENT**: Manage everything, route orders
- **VENDOR**: Manage own inventory, see own orders
- **CLIENT**: Browse catalog, place orders

Navigation items differ per role (see `src/lib/nav.ts`)

---

## What's NOT Built Yet (The Fun Stuff!)

### Phase 4: Catalog & Product Management 🎯
**Next Priority**

Need to build:
1. **Product Catalog Page** - Browse/filter/search products
2. **Vendor Inventory Management** - CRUD for products
3. **Product Detail Pages** - Show vendors, pricing, add to cart

This is where the app becomes useful!

### Phase 5: Cart & Orders
- Shopping cart functionality
- Order submission workflow
- Order status tracking (DRAFT → SUBMITTED → CONFIRMED → FULFILLED)
- Agent order routing

### Phase 6: Agreements & Clients
- Client management (CRUD)
- Vendor management (CRUD)
- Agreement creation/editing
- Agent-client/vendor assignments

### Phase 7: Analytics
- Real KPI cards (currently static placeholders)
- Sales reports
- Inventory reports
- Audit log viewer

---

## Current File Structure

```
hydra/
├── prisma/
│   ├── schema.prisma      # Complete schema (15+ models)
│   ├── seed.ts            # Rich demo data
│   └── migrations/        # 2 migrations applied
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Protected routes
│   │   │   └── dashboard/page.tsx  # 3 role-specific dashboards
│   │   ├── signin/        # Auth page
│   │   └── layout.tsx     # Root with theme provider
│   ├── components/
│   │   ├── dashboard/     # Nav, user menu
│   │   ├── shared/        # RoleGate, PageHeader, DataCard
│   │   └── ui/            # shadcn components
│   └── lib/
│       ├── auth.ts        # currentUser(), requireRole()
│       ├── pricing.ts     # getEffectivePriceCents()
│       ├── nav.ts         # getNavItems(role)
│       └── prisma.ts      # DB client
├── auth.ts                # NextAuth config
└── .env.local             # Neon credentials
```

---

## Key Patterns to Follow

### Server Components (RSC)
```typescript
// Dashboard pages are server components
import { currentUser } from '@/lib/auth'

export default async function DashboardPage() {
  const user = await currentUser() // Server-side auth check
  if (!user) redirect('/signin')

  // Fetch data directly with Prisma
  const products = await prisma.product.findMany()

  return <div>{/* render */}</div>
}
```

### Client Components
```typescript
'use client' // Only when needed (forms, state, event handlers)

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function AddToCartButton() {
  const [loading, setLoading] = useState(false)
  // ...
}
```

### Role-Based Rendering
```typescript
import { RoleGate } from '@/components/shared/role-gate'

<RoleGate allowedRoles={['ADMIN', 'AGENT']} userRole={user.role}>
  <Button>Admin Only Action</Button>
</RoleGate>
```

### Pricing Logic
```typescript
import { getEffectivePriceCents } from '@/lib/pricing'

// Automatically applies agreement pricing (BASE/DISCOUNT/OVERRIDE)
const price = await getEffectivePriceCents({
  clientId: 'client-uuid',
  vendorProductId: 'vp-uuid'
})
```

---

## Demo Logins (Development)

Visit http://localhost:3000/signin and use quick login buttons:

- **Admin**: admin@hydra.local
- **Agent**: andrea@hydra.local
- **Vendor**: vendor.freezco@hydra.local
- **Client**: client.demo@hydra.local

Magic links log to console (no SMTP configured yet).

---

## Common Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm test             # Run 44 tests
pnpm build            # Production build
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio (view data in browser)
pnpm db:reset         # Reset & reseed database
```

---

## Important Context for Prompting

### What to Keep in Mind:
1. **We're building a multi-tenant B2B platform** - Not a simple e-commerce site
2. **Role-based everything** - Always think about who can see/do what
3. **Pricing is complex** - Agreements affect pricing per client-vendor pair
4. **Agents route orders** - They're the "middlemen" managing relationships
5. **Vendors are limited** - They only see their own inventory/orders
6. **Clients browse aggregated catalog** - See products from all vendors

### What NOT to Suggest:
- ❌ Payment processing (out of scope for now)
- ❌ Shipping/delivery tracking (future phase)
- ❌ Reviews/ratings (not needed for B2B)
- ❌ Multi-currency (Italian market only)
- ❌ Public marketplace (private B2B platform)

### What TO Suggest:
- ✅ Product catalog with filters/search
- ✅ Inventory management for vendors
- ✅ Cart and order workflow
- ✅ Agreement management
- ✅ Client/vendor CRUD
- ✅ Agent dashboards with KPIs
- ✅ Order routing logic
- ✅ Audit logging
- ✅ Excel/CSV exports

---

## Next Feature Request Template

When ready to build Phase 4 (Product Catalog), a good prompt would be:

> "Let's build the Product Catalog page for the CLIENT role.
>
> Requirements:
> - Route: `/dashboard/catalog`
> - Show all products from all vendors
> - Filter by category
> - Search by product name
> - Sort by name/price
> - Display: product image (placeholder), name, description, unit, base price
> - Show which vendors have it in stock
> - 'Add to Cart' button (functionality in Phase 5)
> - Use server component with Prisma queries
> - Responsive grid layout
> - Use existing shadcn/ui components
>
> Show me the page component first, then we'll add filters."

---

## Questions to Ask the Developer

Before starting Phase 4, clarify:

1. **Product Images**: Do we need image uploads now, or placeholders for now?
2. **Stock Display**: Show exact stock numbers, or just "In Stock" / "Out of Stock"?
3. **Pricing Display**: Show price with or without agreements applied on catalog page?
4. **Vendor Info**: Show vendor name/logo on product cards?
5. **Mobile Priority**: Mobile-first design, or desktop-first?
6. **Filters**: Which filters are most important? (Category, Vendor, Price Range, In Stock Only)
7. **Search**: Simple text search, or advanced (fuzzy matching, etc.)?
8. **Pagination**: How many products per page? (24? 48?)

---

## Success Criteria for Phase 4

When catalog page is done, users should be able to:
- ✅ Browse all products from all vendors
- ✅ Filter by category (Frozen, Dairy, Beverages, etc.)
- ✅ Search by product name
- ✅ See vendor availability per product
- ✅ See pricing (with agreement discount if applicable)
- ✅ Navigate to product detail page
- ✅ Responsive design (mobile + desktop)

**Not in Phase 4**:
- ❌ Add to cart (Phase 5)
- ❌ Edit products (Phase 4 inventory management, separate page)

---

## Quick Reference: Database Schema

**Key Models**:
```typescript
Product {
  id, name, description, unit, categoryId
}

VendorProduct {
  id, productId, vendorId, sku, basePriceCents, stockQty
}

Agreement {
  id, clientId, vendorId, priceMode, discountPct?, overridePriceCents?
}

Category {
  id, name, slug, groupType (FOOD/BEVERAGE/SERVICES)
}

Vendor {
  id, companyName, vatNumber, contactEmail, phone
}

Client {
  id, companyName, vatNumber, primaryContact
}

User {
  id, email, role, vendorId?, clientId?, agentCode?
}
```

**Key Relations**:
- Product → VendorProduct (1:many) - Same product, different vendors
- Client ↔ Vendor → Agreement (many:many) - Pricing rules
- Client → Cart → CartItem → VendorProduct
- Client → Order → OrderItem → VendorProduct

---

**Status**: 🟢 Phase 1-3 Complete. Ready to build Phase 4 (Product Catalog)!

**Full Details**: See `PROJECT_STATUS.md` for comprehensive documentation.
