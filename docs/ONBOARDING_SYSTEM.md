# Hydra Onboarding + Approval System — Implementation Reference

> This document is the single source of truth for implementing the onboarding and approval access-control system. It captures all architectural decisions, current codebase state, and issue references so any developer or AI assistant can pick up work without prior session context.

**Last updated:** 2026-01-30
**Epic:** [#142](https://github.com/HydraItalia/hydra/issues/142)

---

## Table of Contents

1. [Business Rules](#business-rules)
2. [Current Architecture (Before)](#current-architecture-before)
3. [Target Architecture (After)](#target-architecture-after)
4. [Issue Tracker](#issue-tracker)
5. [Key Files Reference](#key-files-reference)
6. [Schema Changes Required](#schema-changes-required)
7. [Auth Flow Changes](#auth-flow-changes)
8. [Established Patterns to Follow](#established-patterns-to-follow)
9. [Environment Variables](#environment-variables)
10. [Recent Fixes](#recent-fixes)

---

## Business Rules

These are non-negotiable product decisions. Do not debate or redesign.

1. **Auth != Access.** Authentication alone NEVER grants app access.
2. User signs in via magic link -> if NOT in database -> redirect to `/onboarding`.
3. User exists but `status = PENDING` -> redirect to `/pending`.
4. Only users with `status = APPROVED` may access `/dashboard`.
5. Roles: `VENDOR`, `CLIENT`, `DRIVER`, `AGENT`, `ADMIN` (invite-only, never self-selected).
6. Every new user begins as `PENDING`.
7. Approval rules:
   - Vendors -> Admin approval
   - Clients -> Vendor OR Admin approval (must be linked to at least one vendor)
   - Drivers -> Admin approval only
   - Agents -> Admin approval only
8. Users must NEVER see vendor/client data unless explicitly linked via junction tables.

---

## Current Architecture (Before)

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth v5 beta (`next-auth@5.0.0-beta.25`)
- **Database:** PostgreSQL (Neon), Prisma ORM 5.22
- **UI:** Tailwind CSS, shadcn/ui (Radix primitives), Lucide icons
- **Email:** Resend HTTP API (switched from SMTP in PR #141)
- **Payments:** Stripe + Stripe Connect
- **Hosting:** Vercel (serverless)
- **Testing:** Vitest

### Auth Flow (Current)
```
User -> /signin -> magic link email -> click link -> NextAuth creates session
  -> JWT callback enriches token with: id, role, vendorId, clientId, agentCode, driverId
  -> authorized callback: only checks isLoggedIn (no status check)
  -> middleware.ts: no-op (returns NextResponse.next())
  -> dashboard/layout.tsx: checks currentUser(), redirects to /signin if null
  -> page-level role checks: if (user.role !== "ADMIN") redirect("/dashboard")
```

### Current User Model (prisma/schema.prisma:499)
```prisma
model User {
  id            String    @id          // NO @default(cuid()) — breaks NextAuth auto-create
  email         String    @unique
  name          String?
  role          Role      @default(CLIENT)
  agentCode     String?   @unique
  vendorId      String?   @unique      // Direct 1:1 FK to Vendor
  clientId      String?   @unique      // Direct 1:1 FK to Client
  driverId      String?   @unique      // Direct 1:1 FK to Driver
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  emailVerified DateTime?
  // ... relations
}

enum Role {
  ADMIN
  AGENT
  VENDOR
  CLIENT
  DRIVER
}
```

### Problems with Current State
1. `User.id` has no `@default(cuid())` — NextAuth adapter crashes on `user.create()` for new signups.
2. No `status` field — every user in DB is implicitly "active."
3. No `VendorUser` junction — can't have multiple users per vendor.
4. No `ClientVendor` junction — can't track client-vendor links with approval.
5. `middleware.ts` is a no-op — no status-based route gating.
6. `authorized` callback only checks `isLoggedIn`, no status awareness.
7. No onboarding flow — users must be pre-seeded in DB.
8. No pending/approval workflow.

### Current Access Control Pattern
- **Page-level:** `const user = await currentUser(); if (user.role !== "ADMIN") redirect("/dashboard");`
- **Server actions:** `await requireRole("ADMIN")` or `await requireRole("ADMIN", "AGENT")`
- **Helpers:** `canManageVendor()`, `canManageClient()`, `canManageDelivery()` in `src/lib/auth.ts`
- **Navigation:** `getNavItems(role)` in `src/lib/nav.ts` returns role-specific sidebar items

---

## Target Architecture (After)

### New Auth Flow
```
User -> /signin -> magic link -> click link -> NextAuth creates user (PENDING)
  -> JWT callback: enriches token with id, role, STATUS, vendorId, etc.
  -> middleware.ts:
      if no user record       -> redirect /onboarding
      if status = PENDING     -> redirect /pending
      if status = REJECTED    -> redirect /pending (with message)
      if status = SUSPENDED   -> redirect /pending (with message)
      if status = APPROVED    -> allow through to /dashboard
  -> Onboarding: user selects role, fills form -> status stays PENDING
  -> Admin approves -> status = APPROVED -> user can access /dashboard
```

### New Schema Additions

```prisma
enum UserStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum VendorUserRole {
  OWNER
  STAFF
  AGENT
}

enum ClientVendorStatus {
  PENDING
  APPROVED
  REJECTED
}

// Updated User model
model User {
  id                String      @id @default(cuid())  // Added default
  status            UserStatus  @default(PENDING)     // NEW
  approvedAt        DateTime?                         // NEW
  approvedByUserId  String?                           // NEW
  onboardingData    Json?                             // NEW
  // ... existing fields unchanged
}

// NEW junction table
model VendorUser {
  vendorId  String
  userId    String
  role      VendorUserRole
  createdAt DateTime @default(now())
  Vendor    Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  User      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([vendorId, userId])
  @@index([vendorId])
  @@index([userId])
}

// NEW junction table
model ClientVendor {
  clientId         String
  vendorId         String
  status           ClientVendorStatus @default(PENDING)
  approvedByUserId String?
  createdAt        DateTime           @default(now())
  approvedAt       DateTime?
  Client           Client             @relation(fields: [clientId], references: [id], onDelete: Cascade)
  Vendor           Vendor             @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  User             User?              @relation(fields: [approvedByUserId], references: [id])

  @@unique([clientId, vendorId])
  @@index([clientId])
  @@index([vendorId])
}
```

### New Routes
| Route | Purpose | Access |
|-------|---------|--------|
| `/onboarding` | Role selection | Authenticated, no status |
| `/onboarding/vendor` | Vendor registration form | Authenticated, no status |
| `/onboarding/client` | Client registration form | Authenticated, no status |
| `/onboarding/driver` | Driver registration form | Authenticated, no status |
| `/onboarding/agent` | Agent registration form | Authenticated, no status |
| `/pending` | "Awaiting approval" page | Authenticated, PENDING/REJECTED |
| `/dashboard/approvals` | Admin approval dashboard | ADMIN only, APPROVED |
| `/dashboard/approvals/[userId]` | Admin user detail + actions | ADMIN only, APPROVED |

---

## Issue Tracker

### Milestone 1: Auth Gating + Schema
| # | Title | Blocked By |
|---|-------|------------|
| [#143](https://github.com/HydraItalia/hydra/issues/143) | BE: Add UserStatus enum, status field, auto-generated IDs | None |
| [#144](https://github.com/HydraItalia/hydra/issues/144) | BE: Add VendorUser junction table | #143 |
| [#145](https://github.com/HydraItalia/hydra/issues/145) | BE: Add ClientVendor junction table | #143 |
| [#146](https://github.com/HydraItalia/hydra/issues/146) | BE: Update auth callbacks + JWT to include status | #143 |
| [#147](https://github.com/HydraItalia/hydra/issues/147) | BE: Implement status-based route gating in middleware | #146 |

### Milestone 2: Onboarding UX
| # | Title | Blocked By |
|---|-------|------------|
| [#148](https://github.com/HydraItalia/hydra/issues/148) | UI: Role selection page at /onboarding | #147 |
| [#149](https://github.com/HydraItalia/hydra/issues/149) | UI: Vendor onboarding form | #144, #148 |
| [#150](https://github.com/HydraItalia/hydra/issues/150) | UI: Client onboarding form | #145, #148 |
| [#151](https://github.com/HydraItalia/hydra/issues/151) | UI: Driver onboarding form | #148 |
| [#152](https://github.com/HydraItalia/hydra/issues/152) | UI: Agent onboarding form | #148 |
| [#153](https://github.com/HydraItalia/hydra/issues/153) | UI: Pending approval page at /pending | #147 |

### Milestone 3: Admin Approval Tools
| # | Title | Blocked By |
|---|-------|------------|
| [#154](https://github.com/HydraItalia/hydra/issues/154) | UI: Admin approval dashboard | #149-#152 |
| [#155](https://github.com/HydraItalia/hydra/issues/155) | BE: Admin approve/reject/suspend actions | #143 |
| [#156](https://github.com/HydraItalia/hydra/issues/156) | BE: Admin link/unlink client-vendor, user-vendor | #144, #145 |
| [#157](https://github.com/HydraItalia/hydra/issues/157) | UI: Admin user detail page + controls | #154-#156 |

### Milestone 4: QA + Hardening
| # | Title | Blocked By |
|---|-------|------------|
| [#158](https://github.com/HydraItalia/hydra/issues/158) | QA: E2E tests for route gating | #147 |
| [#159](https://github.com/HydraItalia/hydra/issues/159) | QA: E2E tests for onboarding forms | #149-#152 |
| [#160](https://github.com/HydraItalia/hydra/issues/160) | QA: Tests for admin approval actions | #155, #156 |

---

## Key Files Reference

### Auth System
| File | Purpose |
|------|---------|
| `auth.ts` | Main NextAuth config: providers, JWT/session callbacks, Resend email |
| `auth.config.ts` | `authorized` callback, `trustHost`, `pages` config |
| `middleware.ts` | Route-level gating (currently no-op, needs status checks) |
| `src/lib/auth.ts` | `currentUser()`, `requireRole()`, `canManageVendor/Client/Delivery()` |
| `src/lib/demo-mode.ts` | Demo mode config, `DEMO_USERS` list, `isDemoModeEnabled()` |
| `src/lib/email/resend.ts` | Resend HTTP API email sender |
| `src/lib/email/env-check.ts` | Production env validation for email config |

### Navigation & Layout
| File | Purpose |
|------|---------|
| `src/lib/nav.ts` | `getNavItems(role)` — role-based sidebar navigation |
| `src/app/dashboard/layout.tsx` | Dashboard layout with sidebar, auth check |

### Database
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Full Prisma schema |
| `prisma/seed.ts` | Database seeding script |
| `prisma/migrations/` | Migration history |

### Server Actions (patterns to follow)
| File | Purpose |
|------|---------|
| `src/actions/admin-clients.ts` | Client CRUD with `requireRole()`, Zod, audit logging |
| `src/actions/admin-vendors.ts` | Vendor CRUD with `requireRole()`, Zod, audit logging |
| `src/actions/admin-agent-assignments.ts` | Agent-vendor/client linking |

### Audit Logging
The `AuditLog` model already exists in the schema:
```prisma
model AuditLog {
  id          String   @id
  actorUserId String?
  entityType  String
  entityId    String
  action      String
  diff        Json?
  createdAt   DateTime @default(now())
  User        User?    @relation(fields: [actorUserId], references: [id])
}
```
Used via `logAction()` pattern in existing admin actions.

---

## Established Patterns to Follow

### Server Action Pattern
```typescript
"use server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function someAdminAction(id: string) {
  try {
    const user = await requireRole("ADMIN");
    // ... mutation with prisma
    // ... audit log
    revalidatePath("/dashboard/...");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

### Page-Level Access Check
```typescript
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "ADMIN") redirect("/dashboard");
  // ... render page
}
```

### Form Pattern
- `react-hook-form` + `zod` for validation
- `sonner` for toast notifications
- shadcn `Card`, `Form`, `Input`, `Select`, `Button` components

---

## Environment Variables

### Required for Production (Vercel)
| Variable | Purpose | Set? |
|----------|---------|------|
| `AUTH_SECRET` | JWT signing | Yes |
| `DATABASE_URL` | Neon PostgreSQL | Yes |
| `RESEND_API_KEY` | Email delivery via HTTP API | Yes |
| `EMAIL_FROM` | Sender address (`onboarding@resend.dev`) | Yes |
| `CRON_SECRET` | Protects cron + debug endpoints | Check |

### Development (.env.local overrides .env)
| Variable | Purpose |
|----------|---------|
| `AUTH_EMAIL_DEV_MODE` | `"false"` to send real emails, unset/`"true"` for console logging |
| `ENABLE_DEMO_MODE` | `"true"` enables demo user signin |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | Client-side demo mode flag |

### Important Note on .env Precedence
Next.js loads env files in this order (later overrides earlier):
1. `.env`
2. `.env.local` (highest priority for local dev)
3. `.env.production` (production builds)
4. `.env.production.local`

`.env.local` can silently override `.env` values. Always check both.

---

## Recent Fixes

### PR #141 — Fix Magic Link Email Delivery (2026-01-30)
- **Root cause:** Nodemailer SMTP fails on Vercel serverless ("Greeting never received") because outbound SMTP on port 465 is unreliable in serverless.
- **Fix:** Replaced SMTP with Resend HTTP API (`fetch`-based).
- **Files changed:** `auth.ts`, `src/lib/email/resend.ts`, `src/lib/email/env-check.ts`
- **New env var:** `RESEND_API_KEY` (replaces `EMAIL_SERVER`)
- **Status:** Merged, tested locally + in production. Emails deliver successfully.
- **Debug route:** `/api/debug/email` (protected by `CRON_SECRET`) — can be removed after confidence.

---

## Migration Notes

When running schema migrations for this epic:
1. All existing users MUST be backfilled to `status = APPROVED` so they aren't locked out.
2. `User.id` gets `@default(cuid())` — existing rows already have IDs, so this is safe.
3. `VendorUser` and `ClientVendor` are new tables — no data migration needed.
4. Run `prisma migrate deploy` on production after merging schema PRs.
