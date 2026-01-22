# Auth Phase N3 - Deep Dive Security Audit

**Date:** 2026-01-21
**Repo:** hydra
**Branch:** 131-client-vat-breakdown

---

## Table of Contents
1. [Current Auth Architecture Overview](#1-current-auth-architecture-overview)
2. [Demo-Mode and Email-Dev-Mode Toggles](#2-demo-mode-and-email-dev-mode-toggles)
3. [Role Enforcement Map](#3-role-enforcement-map)
4. [User-to-Entity Associations](#4-user-to-entity-associations)
5. [Email Magic-Link Sending](#5-email-magic-link-sending)
6. [Bugs and Risks](#6-bugs-and-risks)
7. [Recommended GH Issue Breakdown](#7-recommended-gh-issue-breakdown)
8. [Auth Cleanup / Deletion Plan](#8-auth-cleanup--deletion-plan)

---

## 1. Current Auth Architecture Overview

### 1.1 NextAuth Configuration

**Primary Config File:** `auth.ts`
**Routing Config:** `auth.config.ts`
**Version:** NextAuth 5.0.0-beta.25 with @auth/prisma-adapter 2.7.2

#### Session Strategy
```typescript
// auth.ts:33
session: { strategy: "jwt" }
```
- **JWT-based sessions** stored in httpOnly cookies
- No server-side session storage (stateless)

#### Database Adapter
```typescript
// auth.ts:32
adapter: PrismaAdapter(prisma) as any,
```
- Uses Prisma Adapter for Account, Session, VerificationToken tables
- Note: `as any` cast suggests type compatibility issue with NextAuth v5 beta

### 1.2 Providers

#### Email Provider (Magic Links)
```typescript
// auth.ts:88-122
EmailProvider({
  server: process.env.EMAIL_SERVER || "smtp://localhost:25",
  from: process.env.EMAIL_FROM || "hydra@localhost.dev",
  sendVerificationRequest: async ({ identifier: email, url, provider }) => {
    // Custom logic - see Section 5
  }
})
```

#### Demo Credentials Provider (Conditional)
```typescript
// auth.ts:36-85
...(isDemoModeEnabled()
  ? [CredentialsProvider({
      id: "demo",
      name: "Demo User",
      credentials: { email: { label: "Email", type: "text" } },
      async authorize(credentials) {
        // Validates against DEMO_USERS whitelist
        // Bypasses email verification
      }
    })]
  : [])
```

### 1.3 Callbacks

#### JWT Callback
```typescript
// auth.ts:126-153
async jwt({ token, user }) {
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id, email, name, role, vendorId, clientId, agentCode, driverId }
    });
    // Populates token with role and entity associations
  }
  return token;
}
```

**Issue:** JWT callback queries database on **every token refresh**, not just initial sign-in. This adds latency but ensures fresh data.

#### Session Callback
```typescript
// auth.ts:154-165
async session({ session, token }) {
  // Copies token data to session.user
  session.user.id = token.id;
  session.user.role = token.role;
  session.user.vendorId = token.vendorId;
  session.user.clientId = token.clientId;
  session.user.agentCode = token.agentCode;
  session.user.driverId = token.driverId;
  return session;
}
```

#### Authorized Callback
```typescript
// auth.config.ts:29-40
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user;
  const isOnSignIn = nextUrl.pathname.startsWith("/signin");

  if (isOnSignIn) {
    if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
    return true;
  }

  return isLoggedIn || nextUrl.pathname === "/";
}
```

**Key Behavior:**
- Only `/` and `/signin` accessible to unauthenticated users
- No role-based rejection at auth level
- Role enforcement happens in pages/actions (defense in depth)

### 1.4 Middleware

**File:** `middleware.ts`

```typescript
export default function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

**Analysis:** Middleware is essentially a no-op. Auth is handled by:
1. `auth.config.ts` authorized callback (for route protection)
2. `src/app/dashboard/layout.tsx` (server-side redirect)

---

## 2. Demo-Mode and Email-Dev-Mode Toggles

### 2.1 Environment Variables Summary

| Variable | Default | File Location | Purpose |
|----------|---------|---------------|---------|
| `ENABLE_DEMO_MODE` | `"false"` (not set) | `src/lib/demo-mode.ts:18-19` | Enables one-click demo signin |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | `"false"` (not set) | Client components | Shows demo UI banner |
| `AUTH_EMAIL_DEV_MODE` | `"true"` (implicit) | `auth.ts:95-97` | Logs magic links, skips email |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | Not set | `src/app/signin/page.tsx:17-18` | Dev quick-login buttons |
| `HYDRA_DEMO_CLIENT_EMAIL` | `"client.demo@hydra.local"` | `prisma/seed.ts:437` | Configurable demo email |

### 2.2 Demo Mode Implementation

**Toggle Check:** `src/lib/demo-mode.ts:18-19`
```typescript
export function isDemoModeEnabled(): boolean {
  return process.env.ENABLE_DEMO_MODE?.toLowerCase() === "true";
}
```

**Demo Users Whitelist:** `src/lib/demo-mode.ts:26-78`
```typescript
export const DEMO_USERS: DemoUser[] = [
  { email: "client.demo@hydra.local", role: "CLIENT", ... },
  { email: "vendor.generalbeverage@hydra.local", role: "VENDOR", ... },
  { email: "vendor.cdfish@hydra.local", role: "VENDOR", ... },
  { email: "testvendor@stripe-test.com", role: "VENDOR", ... },
  { email: "vendor.ghiacciopuro@hydra.local", role: "VENDOR", ... },
  { email: "driver.marco@hydra.local", role: "DRIVER", ... },
  { email: "admin@hydra.local", role: "ADMIN", ... },
  { email: "andrea@hydra.local", role: "AGENT", ... },
];
```

**Where Demo Mode is Used:**
| File | Line | Usage |
|------|------|-------|
| `auth.ts` | 36 | Conditionally adds Credentials provider |
| `src/app/demo-signin/page.tsx` | 24 | Demo user selection page |
| `src/components/auth/demo-mode-banner.tsx` | 16 | Shows warning banner |
| `src/app/page.tsx` | 34-49 | "Try Demo Mode" link on homepage |

### 2.3 Email Dev Mode Implementation

**Toggle Check:** `auth.ts:95-97`
```typescript
const isDevMode =
  process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false" ||
  process.env.NODE_ENV === "development";
```

**Behavior:**
- **Default (not set or `"true"`):** Magic links logged to console, no email sent
- **`"false"` in production:** Logs AND sends real emails via SMTP

**Risk:** Email dev mode is **always enabled in development** regardless of `AUTH_EMAIL_DEV_MODE` setting due to `||` condition.

### 2.4 Dev Quick-Login Shortcuts

**File:** `src/app/signin/page.tsx:17-18`
```typescript
const isDev = process.env.NODE_ENV !== 'production' &&
              process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === '1'
```

**Note:** This still requires clicking the magic link from console - it doesn't bypass auth.

---

## 3. Role Enforcement Map

### 3.1 Role Definition

**File:** `prisma/schema.prisma`
```prisma
enum Role {
  ADMIN
  AGENT
  VENDOR
  CLIENT
  DRIVER
}
```

### 3.2 Server-Side Authorization Functions

**File:** `src/lib/auth.ts`

| Function | Purpose | Location |
|----------|---------|----------|
| `currentUser()` | Gets authenticated user | Lines 10-13 |
| `requireRole(...roles)` | Checks role, redirects on failure | Lines 19-31 |
| `canManageVendor(user, vendorId)` | ADMIN all, VENDOR own, AGENT assigned | Lines 39-71 |
| `canManageClient(user, clientId)` | ADMIN all, CLIENT own, AGENT assigned | Lines 79-111 |
| `canManageDelivery(user, deliveryId)` | ADMIN all, AGENT assigned orders, DRIVER own | Lines 119-165 |

### 3.3 Page-Level Enforcement

#### ADMIN Only
| Page | File | Line |
|------|------|------|
| Agents List | `src/app/dashboard/agents/page.tsx` | 36 |
| Reports Landing | `src/app/dashboard/reports/page.tsx` | requireRole |
| Fee Report | `src/app/dashboard/reports/fee-report/page.tsx` | requireRole |

#### ADMIN + AGENT
| Page | File | Line |
|------|------|------|
| Vendors List | `src/app/dashboard/vendors/page.tsx` | 43 |
| Clients List | `src/app/dashboard/clients/page.tsx` | 43 |
| Shifts List | `src/app/dashboard/shifts/page.tsx` | 51 |
| Deliveries | `src/app/dashboard/deliveries/page.tsx` | 45 |
| Failed Payments | `src/app/dashboard/payments/failed/page.tsx` | requireRole |

#### VENDOR Only
| Page | File | Line |
|------|------|------|
| Vendor Settings | `src/app/dashboard/vendor/settings/page.tsx` | 23 |
| Inventory | `src/app/dashboard/inventory/page.tsx` | 36 |

#### CLIENT Only
| Page | File | Line |
|------|------|------|
| Cart | `src/app/dashboard/cart/page.tsx` | requireRole |
| Catalog | `src/app/dashboard/catalog/page.tsx` | 64 |
| Checkout | `src/app/dashboard/checkout/page.tsx` | 14 |
| Billing | `src/app/dashboard/billing/page.tsx` | 41 |

#### DRIVER Only
| Page | File | Line |
|------|------|------|
| Route | `src/app/dashboard/route/page.tsx` | 25 |

### 3.4 Server Action Enforcement

| Action File | Role Check | Line |
|-------------|------------|------|
| `admin-vendors.ts` | `requireRole("ADMIN", "AGENT")` | Multiple |
| `admin-clients.ts` | `requireRole("ADMIN", "AGENT")` | Multiple |
| `admin-orders.ts` | `requireRole("ADMIN", "AGENT")` | 43 |
| `admin-deliveries.ts` | `requireRole("ADMIN", "AGENT")` | 46 |
| `admin-agent-assignments.ts` | `requireRole("ADMIN")` | 29 |
| `admin-payments.ts` | `requireRole("ADMIN", "AGENT")` | 31 |
| `admin-fee-report.ts` | `requireRole("ADMIN")` | 68+ |
| `vendor-orders.ts` | `user.role !== "VENDOR"` check | 94-96 |
| `vendor-inventory.ts` | `user.role !== "VENDOR"` check | 50-75 |
| `checkout-preview.ts` | `user.role !== "CLIENT"` check | 57 |

### 3.5 API Route Enforcement

| Route | Auth Method | File |
|-------|-------------|------|
| `/api/orders/[orderId]/notes` | `requireRole("ADMIN", "AGENT")` | `src/app/api/orders/[orderId]/notes/route.ts:12` |
| `/api/stripe/setup-intents` | `currentUser()` + `canManageClient()` | `src/app/api/stripe/setup-intents/route.ts:57,111` |
| `/api/stripe/webhooks` | Stripe signature verification | `src/app/api/stripe/webhooks/route.ts:66-75` |
| `/api/jobs/payment-retry` | `CRON_SECRET` or Vercel UA | `src/app/api/jobs/payment-retry/route.ts:37-68` |
| `/api/catalog` | **NONE** | `src/app/api/catalog/route.ts` |

**Risk:** `/api/catalog` has no authentication - see Section 6.

---

## 4. User-to-Entity Associations

### 4.1 Database Schema

**File:** `prisma/schema.prisma` (User model)
```prisma
model User {
  id            String   @id
  email         String   @unique
  role          Role     @default(CLIENT)
  vendorId      String?  @unique  // 1:1 with Vendor
  clientId      String?  @unique  // 1:1 with Client
  agentCode     String?  @unique  // Agent identifier
  driverId      String?  @unique  // 1:1 with Driver

  // Relations
  Client        Client?  @relation(fields: [clientId])
  Vendor        Vendor?  @relation(fields: [vendorId])
  Driver        Driver?  @relation(fields: [driverId])
  AgentClient   AgentClient[]  // Many-to-many
  AgentVendor   AgentVendor[]  // Many-to-many
}
```

### 4.2 Association Patterns

| Role | Association | Constraint |
|------|-------------|------------|
| CLIENT | `user.clientId` -> `Client.id` | 1:1, unique |
| VENDOR | `user.vendorId` -> `Vendor.id` | 1:1, unique |
| DRIVER | `user.driverId` -> `Driver.id` | 1:1, unique |
| AGENT | `user.agentCode` + `AgentClient`/`AgentVendor` junction tables | Many-to-many |
| ADMIN | No entity association | N/A |

### 4.3 Session Population

**File:** `auth.ts:126-164`
```typescript
// JWT callback populates token with:
token.vendorId = dbUser.vendorId;
token.clientId = dbUser.clientId;
token.agentCode = dbUser.agentCode;
token.driverId = dbUser.driverId;

// Session callback copies to session.user
```

### 4.4 Failure Points (Missing Associations)

| Condition | Error Location | Error Message |
|-----------|----------------|---------------|
| CLIENT without clientId | `src/data/orders.ts:23` | "User does not have an associated client" |
| CLIENT without clientId | `src/data/cart.ts:54` | "User does not have an associated client" |
| CLIENT without clientId | `src/actions/checkout-preview.ts:57` | "Only clients can view checkout preview" |
| VENDOR without vendorId | `src/actions/vendor-inventory.ts:57` | "No vendor associated with this account" |
| VENDOR without vendorId | `src/actions/vendor-orders.ts:98-102` | "No vendor associated with this account" |

### 4.5 Debug Page

**File:** `src/app/dashboard/debug/auth/page.tsx:174-186`

Displays warnings for missing associations:
```typescript
<RoleWarningCard
  condition={user.role === "CLIENT" && !user.clientId}
  message="You are a CLIENT user but do not have a clientId assigned..."
/>
```

---

## 5. Email Magic-Link Sending

### 5.1 Transport

**Provider:** Nodemailer (dynamically imported)
**Package:** `nodemailer@^7.0.10`

```typescript
// auth.ts:112-113
const nodemailer = await import("nodemailer");
const transport = nodemailer.createTransport(provider.server);
```

### 5.2 Environment Variables

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `EMAIL_SERVER` | Yes (prod) | `smtp://localhost:25` | `smtp://user:pass@smtp.resend.com:587` |
| `EMAIL_FROM` | Yes (prod) | `hydra@localhost.dev` | `noreply@hydra.app` |
| `AUTH_EMAIL_DEV_MODE` | No | `"true"` | `"false"` for production |

### 5.3 Email Template

**File:** `auth.ts:114-120`

```typescript
await transport.sendMail({
  to: email,
  from: provider.from,
  subject: "Sign in to Hydra",
  text: `Sign in to Hydra\n\n${url}\n\n`,
  html: `<p>Click the link below to sign in:</p><p><a href="${url}">Sign in to Hydra</a></p>`,
});
```

**Issues:**
- Extremely basic template (no branding)
- No separate template files
- No i18n support

### 5.4 Token Management

**Database Model:** `prisma/schema.prisma`
```prisma
model VerificationToken {
  identifier String    // email address
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Handled by:** NextAuth Prisma Adapter (automatic)
**Token Expiry:** 24 hours (NextAuth default)

### 5.5 What Breaks in Production

| Scenario | Symptom | Fix |
|----------|---------|-----|
| `AUTH_EMAIL_DEV_MODE` not set to `"false"` | Emails not sent, magic links only in console | Set `AUTH_EMAIL_DEV_MODE="false"` |
| Invalid `EMAIL_SERVER` | SMTP connection failure, user sees generic error | Validate SMTP credentials |
| Invalid `EMAIL_FROM` | Some SMTP providers reject, emails may land in spam | Use verified sending domain |
| Missing `AUTH_SECRET` | JWT signing fails, complete auth failure | Generate and set secret |
| `BASE_URL`/`NEXTAUTH_URL` mismatch | Magic link URLs incorrect | Ensure both match production URL |

---

## 6. Bugs and Risks

### 6.1 CRITICAL: Unauthenticated Catalog API

**File:** `src/app/api/catalog/route.ts`
**Risk Level:** HIGH

```typescript
export async function GET(req: NextRequest) {
  // No authentication check!
  const result = await fetchCatalogPage({...});
  return NextResponse.json(result);
}
```

**Impact:** Product catalog (including prices) is publicly accessible without authentication.

**Fix:** Add authentication check or rate limiting:
```typescript
const user = await currentUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 6.2 HIGH: Demo Mode Credentials Provider Bypasses Email Verification

**File:** `auth.ts:44-82`
**Risk Level:** HIGH (if enabled in production)

The demo Credentials provider allows one-click signin without email verification. If `ENABLE_DEMO_MODE="true"` in production, attackers could:
1. Sign in as any demo user
2. Access real production data

**Fix:**
1. Add production environment check:
```typescript
if (process.env.NODE_ENV === "production" && isDemoModeEnabled()) {
  console.error("CRITICAL: Demo mode enabled in production!");
  throw new Error("Demo mode cannot be enabled in production");
}
```

### 6.3 MEDIUM: Email Dev Mode Always Enabled in Development

**File:** `auth.ts:95-97`
**Risk Level:** MEDIUM

```typescript
const isDevMode =
  process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false" ||
  process.env.NODE_ENV === "development";
```

The `||` means dev mode is **always on** in development, ignoring `AUTH_EMAIL_DEV_MODE`.

**Impact:** Cannot test real email sending locally.

**Fix:** Change to `&&` for explicit control:
```typescript
const isDevMode =
  process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false" &&
  process.env.NODE_ENV !== "production";
```

### 6.4 MEDIUM: Prisma Adapter Type Cast

**File:** `auth.ts:32`
**Risk Level:** MEDIUM

```typescript
adapter: PrismaAdapter(prisma) as any,
```

The `as any` cast suppresses type errors, potentially hiding breaking changes in NextAuth v5 beta.

**Fix:** Upgrade to stable NextAuth version or create proper type augmentation.

### 6.5 MEDIUM: JWT Callback Database Query on Every Refresh

**File:** `auth.ts:126-152`
**Risk Level:** MEDIUM (performance)

```typescript
async jwt({ token, user }) {
  if (user) {  // Only on initial signin
    const dbUser = await prisma.user.findUnique({...});
  }
  return token;
}
```

**Current:** Only queries on `user` presence (initial signin).
**Risk:** If token is refreshed without `user`, stale data persists until re-login.

**Recommendation:** Consider adding periodic refresh or trigger-based invalidation.

### 6.6 MEDIUM: Cron Job Auth Allows Spoofed User-Agent

**File:** `src/app/api/jobs/payment-retry/route.ts:43-58`
**Risk Level:** MEDIUM

```typescript
const isVercelCron = userAgent.includes("vercel-cron/1.0");
if (isVercelCron) return true;  // Can be spoofed!
```

**Fix:** In production, require `CRON_SECRET` regardless of User-Agent:
```typescript
if (process.env.NODE_ENV === "production" && !cronSecret) {
  console.error("CRON_SECRET must be set in production");
  return false;
}
```

### 6.7 LOW: No Rate Limiting on Magic Link Requests

**File:** `src/app/signin/page.tsx`
**Risk Level:** LOW

Users can spam magic link requests without limit.

**Impact:** Potential email flooding, DoS on SMTP.

**Fix:** Add rate limiting at API level or use NextAuth's built-in verification request throttling.

### 6.8 LOW: Missing Association Enforcement at Database Level

**Files:** `prisma/schema.prisma`
**Risk Level:** LOW

Role-entity associations are not enforced at database level. A CLIENT user could theoretically have a `vendorId` set (though code prevents this).

**Fix:** Add database constraints or triggers (optional, defense in depth).

### 6.9 INFO: Basic Email Template

**File:** `auth.ts:114-120`
**Risk Level:** INFO (UX)

Email template is extremely basic with no branding.

**Recommendation:** Create proper email templates with:
- Company branding
- Security warnings
- Expiry information
- i18n support

---

## 7. Recommended GH Issue Breakdown

### N3.1: Secure Production Environment Checks

**Priority:** P0 (Critical)
**Effort:** S (Small)

**Description:**
Add runtime checks to prevent demo mode and other development features from being enabled in production.

**Acceptance Criteria:**
- [ ] Application throws error on startup if `ENABLE_DEMO_MODE=true` in production
- [ ] Warning logged if `AUTH_EMAIL_DEV_MODE` not explicitly set to `"false"` in production
- [ ] Add `NODE_ENV` validation in critical paths

**Files to Change:**
- `auth.ts`
- `src/lib/demo-mode.ts`

**PR Sequence:** 1 of 6 (standalone)

---

### N3.2: Authenticate Catalog API

**Priority:** P0 (Critical)
**Effort:** S (Small)

**Description:**
Add authentication to `/api/catalog` endpoint to prevent unauthenticated access to product/pricing data.

**Acceptance Criteria:**
- [ ] `GET /api/catalog` returns 401 for unauthenticated requests
- [ ] Authenticated CLIENT users can access catalog
- [ ] Consider: Should other roles access catalog API?

**Files to Change:**
- `src/app/api/catalog/route.ts`

**PR Sequence:** 2 of 6 (standalone)

---

### N3.3: Harden Cron Job Authentication

**Priority:** P1 (High)
**Effort:** S (Small)

**Description:**
Remove User-Agent spoofing vulnerability in cron job authentication.

**Acceptance Criteria:**
- [ ] In production, `CRON_SECRET` is required regardless of User-Agent
- [ ] Add startup validation that `CRON_SECRET` is set in production
- [ ] Document cron job security in `docs/`

**Files to Change:**
- `src/app/api/jobs/payment-retry/route.ts`
- Any other cron job routes

**PR Sequence:** 3 of 6 (standalone)

---

### N3.4: Fix Email Dev Mode Logic

**Priority:** P2 (Medium)
**Effort:** XS (Extra Small)

**Description:**
Fix the email dev mode toggle to respect `AUTH_EMAIL_DEV_MODE` setting in development.

**Acceptance Criteria:**
- [ ] `AUTH_EMAIL_DEV_MODE="false"` in development sends real emails
- [ ] Default behavior unchanged (dev mode on by default)
- [ ] Update documentation in `.env.example`

**Files to Change:**
- `auth.ts` (line 95-97)
- `.env.example`

**PR Sequence:** 4 of 6 (standalone)

---

### N3.5: Improve Email Templates

**Priority:** P3 (Low)
**Effort:** M (Medium)

**Description:**
Create proper email templates for magic link authentication.

**Acceptance Criteria:**
- [ ] Create template file(s) in `src/templates/` or similar
- [ ] Add Hydra branding
- [ ] Include security information (expiry, "didn't request this" notice)
- [ ] Consider i18n support (Italian primary)

**Files to Change:**
- `auth.ts`
- New: `src/templates/auth-email.tsx` (React Email or similar)

**PR Sequence:** 5 of 6 (depends on nothing)

---

### N3.6: Add Magic Link Rate Limiting

**Priority:** P3 (Low)
**Effort:** M (Medium)

**Description:**
Add rate limiting to prevent magic link request abuse.

**Acceptance Criteria:**
- [ ] Max 5 magic link requests per email per hour
- [ ] Return user-friendly error when rate limited
- [ ] Consider using upstash/ratelimit or similar

**Files to Change:**
- `auth.ts` (sendVerificationRequest)
- Potentially add rate limiting middleware

**PR Sequence:** 6 of 6 (standalone)

---

### Recommended PR Sequence

```
N3.1 ─────┐
N3.2 ─────┼──► Deploy Critical Fixes
N3.3 ─────┘

N3.4 ─────────► Deploy Medium Fix

N3.5 ─────┐
N3.6 ─────┴──► Deploy Improvements
```

**Total Estimated Effort:** ~2-3 days

---

## 8. Auth Cleanup / Deletion Plan

This section identifies auth-related files that are unused, legacy, or redundant, with recommendations for cleanup.

### 8.1 Classification Legend

| Status | Meaning |
|--------|---------|
| **KEEP** | Actively used, essential to auth system |
| **DEPRECATE** | Still referenced but should be phased out |
| **DELETE** | Confirmed unused, safe to remove |

---

### 8.2 File-by-File Analysis

#### Unused Components (DELETE)

| File | Status | Evidence | Impact |
|------|--------|----------|--------|
| `src/components/auth/auth-guard.tsx` | **DELETE** | Zero imports found in codebase | None - never used |
| `src/components/auth/role-guard.tsx` | **DELETE** | Zero imports found in codebase | None - never used |
| `src/components/shared/role-gate.tsx` | **DELETE** | Only imported in test file, never in production code | Test coverage lost (acceptable) |

#### Unused Hooks (DELETE)

| File | Status | Evidence | Impact |
|------|--------|----------|--------|
| `src/hooks/use-require-auth.ts` | **DELETE** | Only imported by unused `AuthGuard` | None |
| `src/hooks/use-require-role.ts` | **DELETE** | Only imported by unused `RoleGuard` | None |

#### Legacy Demo UI (DEPRECATE → DELETE)

| File | Lines | Status | Evidence |
|------|-------|--------|----------|
| `src/app/signin/page.tsx` | 17-18, 127-218 | **DEPRECATE** | Uses legacy `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` env var |

**What it is:** Old "Dev Mode - Quick Login" buttons that pre-fill email and still require clicking magic link from console.

**Replacement:** The `/demo-signin` page provides better UX with one-click signin using the Credentials provider.

#### Unused Authorization Functions (KEEP for now)

| Function | File | Status | Evidence |
|----------|------|--------|----------|
| `canManageVendor()` | `src/lib/auth.ts:39-71` | **KEEP** | Unused now but valuable for future vendor detail pages |
| `canManageDelivery()` | `src/lib/auth.ts:119-165` | **KEEP** | Unused now but valuable for driver/delivery authorization |
| `canManageClient()` | `src/lib/auth.ts:79-111` | **KEEP** | Used in `src/app/api/stripe/setup-intents/route.ts:111` |

#### Legacy Environment Variable (DEPRECATE)

| Variable | Status | Files Using It |
|----------|--------|----------------|
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | **DEPRECATE** | `src/app/signin/page.tsx:18` only |

**Replacement:** Use `NEXT_PUBLIC_ENABLE_DEMO_MODE` + `/demo-signin` page instead.

#### Test Files for Deleted Code

| File | Status | Reason |
|------|--------|--------|
| `src/components/shared/__tests__/role-gate.test.tsx` | **DELETE** | Tests unused `RoleGate` component |

#### Deprecated Server Actions

| Function | File | Status | Evidence |
|----------|------|--------|----------|
| `updateVendorOrderStatus()` | `src/actions/vendor-orders.ts:273-285` | **KEEP** (returns error) | Explicitly marked `@deprecated`, returns error message directing to new function |

---

### 8.3 Files to KEEP (Active Auth System)

These files are essential and actively used:

| Category | Files |
|----------|-------|
| **Core Config** | `auth.ts`, `auth.config.ts`, `middleware.ts` |
| **Auth Utilities** | `src/lib/auth.ts` (currentUser, requireRole, canManage*) |
| **Demo Mode** | `src/lib/demo-mode.ts`, `src/components/auth/demo-mode-banner.tsx`, `src/app/demo-signin/page.tsx` |
| **Active Components** | `src/components/auth/session-provider.tsx`, `src/components/auth/sign-out-button.tsx`, `src/components/auth/demo-user-card.tsx`, `src/components/auth/user-avatar.tsx` |
| **Hooks** | `src/hooks/use-session.ts`, `src/hooks/use-user.ts` |
| **Types** | `types/next-auth.d.ts` |
| **Debug** | `src/app/dashboard/debug/auth/page.tsx` (useful for debugging, restrict to ADMIN in prod) |

---

### 8.4 Transition Plan for DEPRECATE Items

#### Migrate Away from `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`

**Current State:**
- `src/app/signin/page.tsx:17-18` checks `NEXT_PUBLIC_ENABLE_DEMO_LOGIN === '1'`
- Shows old dev login buttons that pre-fill email but still need magic link click

**Transition Steps:**
1. Update documentation to remove references to `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`
2. Remove lines 17-18 and 127-218 from `src/app/signin/page.tsx`
3. Remove variable from:
   - `docs/ENV_SETUP.md`
   - `VERCEL_DEPLOY.md`
   - `PROJECT_STATUS.md`
4. Ensure `/demo-signin` page works correctly with `ENABLE_DEMO_MODE`

**What Replaces It:**
- `ENABLE_DEMO_MODE="true"` + `NEXT_PUBLIC_ENABLE_DEMO_MODE="true"`
- Users go to `/demo-signin` for one-click demo access
- Much better UX (true one-click, no magic link needed)

---

### 8.5 DELETE Verification Checklist

Before deleting each file, verify nothing breaks:

#### `src/components/auth/auth-guard.tsx`
```bash
# Verify no imports
grep -r "auth-guard" src/ --include="*.ts" --include="*.tsx"
grep -r "AuthGuard" src/ --include="*.ts" --include="*.tsx"
# Expected: No results (or only the file itself)
```

#### `src/components/auth/role-guard.tsx`
```bash
# Verify no imports
grep -r "role-guard" src/ --include="*.ts" --include="*.tsx"
grep -r "RoleGuard" src/ --include="*.ts" --include="*.tsx"
# Expected: No results (or only the file itself)
```

#### `src/components/shared/role-gate.tsx`
```bash
# Verify only test import
grep -r "role-gate" src/ --include="*.ts" --include="*.tsx"
grep -r "RoleGate" src/ --include="*.ts" --include="*.tsx"
# Expected: Only test file
```

#### `src/hooks/use-require-auth.ts`
```bash
# Verify only unused component imports it
grep -r "use-require-auth" src/ --include="*.ts" --include="*.tsx"
grep -r "useRequireAuth" src/ --include="*.ts" --include="*.tsx"
# Expected: Only auth-guard.tsx (which is also being deleted)
```

#### `src/hooks/use-require-role.ts`
```bash
# Verify only unused component imports it
grep -r "use-require-role" src/ --include="*.ts" --include="*.tsx"
grep -r "useRequireRole" src/ --include="*.ts" --include="*.tsx"
# Expected: Only role-guard.tsx (which is also being deleted)
```

#### Runtime Smoke Tests After Deletion
```bash
# Build should succeed
pnpm build

# Tests should pass (excluding deleted test files)
pnpm test

# Manual verification
# 1. Sign in via magic link works
# 2. Sign in via demo mode works (if enabled)
# 3. Role-based page access works (ADMIN can see /dashboard/agents, etc.)
# 4. Sign out works
```

---

### 8.6 Safe Delete Order

Delete files in this order to minimize risk:

#### Phase 1: Delete Unused Hooks (No Dependencies)
```
1. src/hooks/use-require-auth.ts
2. src/hooks/use-require-role.ts
```

#### Phase 2: Delete Unused Components (Depend on Deleted Hooks)
```
3. src/components/auth/auth-guard.tsx
4. src/components/auth/role-guard.tsx
5. src/components/shared/role-gate.tsx
```

#### Phase 3: Delete Orphaned Tests
```
6. src/components/shared/__tests__/role-gate.test.tsx
```

#### Phase 4: Remove Legacy Code from Active Files
```
7. src/app/signin/page.tsx - Remove lines 17-18, 127-218 (legacy dev login UI)
```

#### Phase 5: Update Documentation
```
8. docs/ENV_SETUP.md - Remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN references
9. VERCEL_DEPLOY.md - Remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN references
10. PROJECT_STATUS.md - Remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN references
```

---

### 8.7 Summary Table

| Item | Action | Priority | Risk | Effort |
|------|--------|----------|------|--------|
| `auth-guard.tsx` | DELETE | P2 | Low | XS |
| `role-guard.tsx` | DELETE | P2 | Low | XS |
| `role-gate.tsx` | DELETE | P2 | Low | XS |
| `use-require-auth.ts` | DELETE | P2 | Low | XS |
| `use-require-role.ts` | DELETE | P2 | Low | XS |
| `role-gate.test.tsx` | DELETE | P2 | Low | XS |
| Legacy signin UI | DEPRECATE→DELETE | P3 | Low | S |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` refs | DELETE from docs | P3 | Low | XS |
| `canManageVendor/Delivery` | KEEP | - | - | - |
| Debug auth page | KEEP (restrict in prod) | - | - | - |

**Total Cleanup Effort:** ~1-2 hours

---

### 8.8 Recommended N3.7 Issue: Auth Code Cleanup

**Priority:** P3 (Low)
**Effort:** S (Small)

**Description:**
Remove unused auth-related files and legacy demo mode UI.

**Acceptance Criteria:**
- [ ] Delete unused components: `auth-guard.tsx`, `role-guard.tsx`, `role-gate.tsx`
- [ ] Delete unused hooks: `use-require-auth.ts`, `use-require-role.ts`
- [ ] Delete orphaned test: `role-gate.test.tsx`
- [ ] Remove legacy dev login UI from `signin/page.tsx`
- [ ] Remove `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` from documentation
- [ ] Build and tests pass
- [ ] Manual smoke test: signin, demo mode, role-based access

**Files to Delete:**
```
src/components/auth/auth-guard.tsx
src/components/auth/role-guard.tsx
src/components/shared/role-gate.tsx
src/components/shared/__tests__/role-gate.test.tsx
src/hooks/use-require-auth.ts
src/hooks/use-require-role.ts
```

**Files to Modify:**
```
src/app/signin/page.tsx (remove lines 17-18, 127-218)
docs/ENV_SETUP.md (remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN)
VERCEL_DEPLOY.md (remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN)
PROJECT_STATUS.md (remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN)
```

**PR Sequence:** After N3.1-N3.6 (standalone cleanup)

---

## Appendix: Key File Reference

| Purpose | File Path |
|---------|-----------|
| NextAuth Main Config | `auth.ts` |
| NextAuth Routing Config | `auth.config.ts` |
| Middleware | `middleware.ts` |
| Auth Utilities | `src/lib/auth.ts` |
| Demo Mode Utilities | `src/lib/demo-mode.ts` |
| Session Types | `types/next-auth.d.ts` |
| User Model | `prisma/schema.prisma` |
| Sign-in Page | `src/app/signin/page.tsx` |
| Demo Sign-in Page | `src/app/demo-signin/page.tsx` |
| Dashboard Layout | `src/app/dashboard/layout.tsx` |
| Demo Mode Banner | `src/components/auth/demo-mode-banner.tsx` |
| Role Gate Component | `src/components/shared/role-gate.tsx` |
| Role Guard Component | `src/components/auth/role-guard.tsx` |
| Auth Debug Page | `src/app/dashboard/debug/auth/page.tsx` |
| Catalog API | `src/app/api/catalog/route.ts` |
| Payment Retry Cron | `src/app/api/jobs/payment-retry/route.ts` |
| Environment Template | `.env.example` |

---

*Generated by Claude Code Auth Audit - Phase N3*
