# Auth Phase N3 - Implementation Roadmap

**Source:** `AUTH_AUDIT_N3.md`
**Hard Decisions:**
- Real auth: ALL users authenticate with personal email (magic links)
- Demo auth stays but must be isolated behind a single flag and **must not run in production**
- Remove/deprecate unused/legacy auth code to prevent pile-up

---

## Issue Overview (4 Issues)

| Issue | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| N3.1 | Secure Demo Mode Isolation | P0 | S | None |
| N3.2 | Auth Security Hardening | P0 | S | None |
| N3.3 | Auth Code Cleanup | P2 | S | N3.1 |
| N3.4 | Fix Email Dev Mode Logic | P3 | XS | None |

**PR Sequence:**
```
N3.1 ─────┬──► Can merge independently
N3.2 ─────┘

N3.3 ─────────► Merge after N3.1

N3.4 ─────────► Can merge anytime
```

---

## Dev Testing Guidance: Role Changes

### When you change a user's role in the database, what happens?

**Current Behavior:**
- JWT tokens are populated with role/entity data **only on initial sign-in** (`auth.ts:126-152`)
- The `if (user)` check means the DB is only queried when `user` object exists (first login)
- Subsequent token refreshes reuse the cached JWT data

**To reflect a role change, the user MUST:**
1. **Sign out** (clears the session cookie)
2. **Sign back in** (triggers new JWT callback with fresh DB data)

**There is no automatic session invalidation.** Changing `role`, `clientId`, `vendorId`, etc. in the database does NOT propagate to active sessions.

### Testing Checklist After DB Role Change

```bash
# 1. Change user role in DB
pnpm prisma studio
# Or: UPDATE "User" SET role = 'ADMIN' WHERE email = 'test@example.com';

# 2. Verify current session still has OLD role
# - Visit /dashboard/debug/auth
# - Note the displayed role

# 3. Sign out
# - Click sign out button
# - Verify redirected to /signin

# 4. Sign back in
# - Request magic link or use demo mode
# - Verify new role in /dashboard/debug/auth

# 5. Verify role-based access
# - ADMIN: Can access /dashboard/agents
# - CLIENT: Can access /dashboard/catalog
# - VENDOR: Can access /dashboard/inventory
# - etc.
```

### Future Consideration (Not in N3 Scope)

To enable immediate role updates without re-login, you would need to:
1. Add a `tokenVersion` field to User model
2. Increment it when role changes
3. Check version in JWT callback and re-fetch if stale
4. Or: Implement session invalidation via database

---

## N3.1: Secure Demo Mode Isolation

### Summary
Prevent demo mode from running in production and consolidate demo flags into a single source of truth.

### Scope
- Add production runtime guard that throws if demo mode enabled
- Consolidate `ENABLE_DEMO_MODE` as the single source of truth
- Keep `NEXT_PUBLIC_ENABLE_DEMO_MODE` for client UI only
- Remove legacy `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` pattern

### Acceptance Criteria
- [ ] Application throws error on startup if `ENABLE_DEMO_MODE=true` AND `NODE_ENV=production`
- [ ] Console warning logged if demo mode enabled in non-production
- [ ] `isDemoModeEnabled()` returns false in production regardless of env var
- [ ] `/demo-signin` page redirects to `/signin` in production
- [ ] Demo Credentials provider not registered in production
- [ ] Build passes, existing demo mode works in development

### Files to Touch
```
auth.ts                           # Add production guard, modify provider registration
src/lib/demo-mode.ts              # Add production-safe check
src/app/demo-signin/page.tsx      # Add production redirect
```

### PR Order
1 of 4 - Can merge independently

---

## N3.2: Auth Security Hardening

### Summary
Fix the two security vulnerabilities identified in the audit: unauthenticated catalog API and spoofable cron job auth.

### Scope
- Add authentication to `/api/catalog` endpoint
- Harden cron job authentication to require `CRON_SECRET` in production

### Acceptance Criteria
- [ ] `GET /api/catalog` returns 401 for unauthenticated requests
- [ ] `GET /api/catalog` returns 200 for authenticated users (any role with valid session)
- [ ] Cron job requires `CRON_SECRET` in production, ignores User-Agent spoofing
- [ ] Cron job still works in development without `CRON_SECRET`
- [ ] Add tests for catalog API auth
- [ ] Document cron job security requirements

### Files to Touch
```
src/app/api/catalog/route.ts           # Add currentUser() check
src/app/api/jobs/payment-retry/route.ts # Harden isAuthorized()
.env.example                            # Document CRON_SECRET requirement
```

### PR Order
2 of 4 - Can merge independently

---

## N3.3: Auth Code Cleanup

### Summary
Remove unused auth-related code to prevent pile-up and simplify the codebase.

### Scope
- Delete unused components and hooks
- Remove legacy demo login UI from signin page
- Clean up documentation references

### Acceptance Criteria
- [ ] Deleted: `src/components/auth/auth-guard.tsx`
- [ ] Deleted: `src/components/auth/role-guard.tsx`
- [ ] Deleted: `src/components/shared/role-gate.tsx`
- [ ] Deleted: `src/components/shared/__tests__/role-gate.test.tsx`
- [ ] Deleted: `src/hooks/use-require-auth.ts`
- [ ] Deleted: `src/hooks/use-require-role.ts`
- [ ] Removed legacy dev login UI from `src/app/signin/page.tsx`
- [ ] Removed `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` from all documentation
- [ ] Build passes
- [ ] Manual smoke test: signin, demo mode, role-based access all work

### Files to Delete
```
src/components/auth/auth-guard.tsx
src/components/auth/role-guard.tsx
src/components/shared/role-gate.tsx
src/components/shared/__tests__/role-gate.test.tsx
src/hooks/use-require-auth.ts
src/hooks/use-require-role.ts
```

### Files to Modify
```
src/app/signin/page.tsx    # Remove lines 17-18, 127-218
docs/ENV_SETUP.md          # Remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN
VERCEL_DEPLOY.md           # Remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN
PROJECT_STATUS.md          # Remove NEXT_PUBLIC_ENABLE_DEMO_LOGIN
```

### Safety Verification Before Deletion
```bash
# Run these greps to confirm no production imports exist:
grep -r "AuthGuard" src/ --include="*.ts" --include="*.tsx" | grep -v "auth-guard.tsx"
grep -r "RoleGuard" src/ --include="*.ts" --include="*.tsx" | grep -v "role-guard.tsx"
grep -r "RoleGate" src/ --include="*.ts" --include="*.tsx" | grep -v "role-gate"
grep -r "useRequireAuth" src/ --include="*.ts" --include="*.tsx" | grep -v "use-require-auth.ts"
grep -r "useRequireRole" src/ --include="*.ts" --include="*.tsx" | grep -v "use-require-role.ts"
# All should return empty or only the file being deleted
```

### PR Order
3 of 4 - Merge after N3.1 (depends on demo mode being consolidated)

---

## N3.4: Fix Email Dev Mode Logic

### Summary
Fix the `||` vs `&&` logic bug that prevents testing real email sending in development.

### Scope
- Change email dev mode logic to respect `AUTH_EMAIL_DEV_MODE` setting
- Update documentation

### Acceptance Criteria
- [ ] `AUTH_EMAIL_DEV_MODE="false"` in development sends real emails
- [ ] Default behavior unchanged (dev mode on if not set)
- [ ] Production always sends real emails when `AUTH_EMAIL_DEV_MODE="false"`
- [ ] Updated `.env.example` documentation

### Files to Touch
```
auth.ts         # Fix line 95-97 logic
.env.example    # Clarify AUTH_EMAIL_DEV_MODE behavior
```

### PR Order
4 of 4 - Can merge anytime (standalone)

---

## Cleanup/Deletion List

### Files to DELETE (6 files)

| File | Reason | Verified Unused |
|------|--------|-----------------|
| `src/components/auth/auth-guard.tsx` | Zero production imports | Yes |
| `src/components/auth/role-guard.tsx` | Zero production imports | Yes |
| `src/components/shared/role-gate.tsx` | Only imported in test | Yes |
| `src/components/shared/__tests__/role-gate.test.tsx` | Tests deleted component | Yes |
| `src/hooks/use-require-auth.ts` | Only imported by deleted AuthGuard | Yes |
| `src/hooks/use-require-role.ts` | Only imported by deleted RoleGuard | Yes |

### Code to REMOVE from Active Files

| File | Lines | What to Remove |
|------|-------|----------------|
| `src/app/signin/page.tsx` | 17-18 | `isDev` variable declaration |
| `src/app/signin/page.tsx` | 127-218 | Entire `{isDev && ...}` block (legacy dev login UI) |

### Documentation References to REMOVE

| File | Content to Remove |
|------|-------------------|
| `docs/ENV_SETUP.md` | All `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` references |
| `VERCEL_DEPLOY.md` | All `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` references |
| `PROJECT_STATUS.md` | All `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` references |

### Safe Delete Order

```
Phase 1: Delete hooks first (no dependents)
  1. src/hooks/use-require-auth.ts
  2. src/hooks/use-require-role.ts

Phase 2: Delete components (depend on deleted hooks)
  3. src/components/auth/auth-guard.tsx
  4. src/components/auth/role-guard.tsx
  5. src/components/shared/role-gate.tsx

Phase 3: Delete orphaned tests
  6. src/components/shared/__tests__/role-gate.test.tsx

Phase 4: Modify active files
  7. src/app/signin/page.tsx (remove legacy UI)
  8. docs/ENV_SETUP.md
  9. VERCEL_DEPLOY.md
  10. PROJECT_STATUS.md
```

### Post-Cleanup Verification

```bash
# Build must pass
pnpm build

# Tests must pass
pnpm test

# Manual smoke tests
# 1. Sign in via magic link (/signin)
# 2. Sign in via demo mode (/demo-signin) - if ENABLE_DEMO_MODE=true
# 3. Verify role-based routing:
#    - ADMIN sees /dashboard/agents
#    - CLIENT sees /dashboard/catalog
#    - VENDOR sees /dashboard/inventory
# 4. Sign out works
```

---

## GitHub Issue Bodies

### N3.1: Secure Demo Mode Isolation

```markdown
## Summary

Prevent demo mode from running in production and consolidate demo flags into a single source of truth.

## Context

Demo mode currently uses the Credentials provider which bypasses email verification. If accidentally enabled in production, attackers could sign in as any demo user and access real data.

**Hard Decision:** Demo auth stays for dev/demos but must be isolated behind a single flag and **must not run in production**.

## Acceptance Criteria

- [ ] Application throws error on startup if `ENABLE_DEMO_MODE=true` AND `NODE_ENV=production`
- [ ] Console warning logged if demo mode enabled in non-production
- [ ] `isDemoModeEnabled()` returns false in production regardless of env var
- [ ] `/demo-signin` page redirects to `/signin` in production
- [ ] Demo Credentials provider not registered in production
- [ ] Build passes, existing demo mode works in development

## Files to Change

- `auth.ts` - Add production guard, modify provider registration
- `src/lib/demo-mode.ts` - Add production-safe check
- `src/app/demo-signin/page.tsx` - Add production redirect

## Testing

```bash
# Development - demo mode should work
ENABLE_DEMO_MODE=true pnpm dev
# Visit /demo-signin, one-click login should work

# Production build - should throw if demo enabled
NODE_ENV=production ENABLE_DEMO_MODE=true pnpm build
# Should fail with error message

# Production build - should succeed without demo
NODE_ENV=production pnpm build
# Should succeed
```

## Labels

`auth`, `security`, `P0`
```

---

### N3.2: Auth Security Hardening

```markdown
## Summary

Fix two security vulnerabilities: unauthenticated catalog API and spoofable cron job auth.

## Context

From Auth N3 audit:
1. `/api/catalog` has no authentication - product/pricing data publicly accessible
2. Cron job auth accepts spoofed `vercel-cron/1.0` User-Agent header

## Acceptance Criteria

- [ ] `GET /api/catalog` returns 401 for unauthenticated requests
- [ ] `GET /api/catalog` returns 200 for authenticated users
- [ ] Cron job requires `CRON_SECRET` in production (ignores User-Agent)
- [ ] Cron job still works in development without `CRON_SECRET`
- [ ] Document `CRON_SECRET` requirement in `.env.example`

## Files to Change

- `src/app/api/catalog/route.ts` - Add `currentUser()` check
- `src/app/api/jobs/payment-retry/route.ts` - Harden `isAuthorized()`
- `.env.example` - Document `CRON_SECRET`

## Implementation

### Catalog API
```typescript
// src/app/api/catalog/route.ts
import { currentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... existing logic
}
```

### Cron Job
```typescript
// src/app/api/jobs/payment-retry/route.ts
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // Production MUST have CRON_SECRET
  if (process.env.NODE_ENV === "production") {
    if (!cronSecret) {
      console.error("[Payment Retry] CRON_SECRET required in production");
      return false;
    }
    const authHeader = request.headers.get("authorization");
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Development: allow without secret
  return true;
}
```

## Testing

```bash
# Catalog API - should require auth
curl http://localhost:3000/api/catalog
# Expected: 401 Unauthorized

# Cron job - spoofed UA should fail in prod
curl -H "User-Agent: vercel-cron/1.0" http://localhost:3000/api/jobs/payment-retry
# Expected: 401 in production, 200 in development
```

## Labels

`auth`, `security`, `P0`
```

---

### N3.3: Auth Code Cleanup

```markdown
## Summary

Remove unused auth-related code to prevent pile-up and simplify the codebase.

## Context

Auth N3 audit identified several unused files and legacy code:
- Components never imported in production
- Hooks only used by unused components
- Legacy demo login UI replaced by `/demo-signin` page
- Documentation referencing deprecated `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`

## Acceptance Criteria

- [ ] Deleted unused components and hooks (see list below)
- [ ] Removed legacy dev login UI from signin page
- [ ] Removed `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` from all documentation
- [ ] Build passes
- [ ] Manual smoke test: signin, demo mode, role-based access work

## Files to Delete

```
src/components/auth/auth-guard.tsx
src/components/auth/role-guard.tsx
src/components/shared/role-gate.tsx
src/components/shared/__tests__/role-gate.test.tsx
src/hooks/use-require-auth.ts
src/hooks/use-require-role.ts
```

## Files to Modify

- `src/app/signin/page.tsx` - Remove lines 17-18, 127-218 (legacy dev login UI)
- `docs/ENV_SETUP.md` - Remove `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` references
- `VERCEL_DEPLOY.md` - Remove `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` references
- `PROJECT_STATUS.md` - Remove `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` references

## Pre-Delete Verification

```bash
# Confirm no production imports
grep -r "AuthGuard" src/ --include="*.ts" --include="*.tsx" | grep -v "auth-guard.tsx"
grep -r "RoleGuard" src/ --include="*.ts" --include="*.tsx" | grep -v "role-guard.tsx"
grep -r "RoleGate" src/ --include="*.ts" --include="*.tsx" | grep -v "role-gate"
grep -r "useRequireAuth" src/ --include="*.ts" --include="*.tsx" | grep -v "use-require-auth.ts"
grep -r "useRequireRole" src/ --include="*.ts" --include="*.tsx" | grep -v "use-require-role.ts"
# All should be empty
```

## Testing

```bash
pnpm build
pnpm test

# Manual: verify auth flows still work
# 1. /signin with magic link
# 2. /demo-signin (if enabled)
# 3. Role-based page access
# 4. Sign out
```

## Depends On

- N3.1 (demo mode consolidated before removing legacy UI)

## Labels

`cleanup`, `auth`, `P2`
```

---

### N3.4: Fix Email Dev Mode Logic

```markdown
## Summary

Fix the logic bug that prevents testing real email sending in development.

## Context

Current logic in `auth.ts`:
```typescript
const isDevMode =
  process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false" ||
  process.env.NODE_ENV === "development";
```

The `||` means dev mode is **always on** in development, ignoring `AUTH_EMAIL_DEV_MODE="false"`.

## Acceptance Criteria

- [ ] `AUTH_EMAIL_DEV_MODE="false"` in development sends real emails
- [ ] Default behavior unchanged (dev mode on if `AUTH_EMAIL_DEV_MODE` not set)
- [ ] Production sends real emails when `AUTH_EMAIL_DEV_MODE="false"`
- [ ] Updated `.env.example` with clear documentation

## Files to Change

- `auth.ts` (line 95-97)
- `.env.example`

## Implementation

```typescript
// auth.ts - Fixed logic
const isDevMode =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_EMAIL_DEV_MODE?.toLowerCase() !== "false";
```

**Behavior Matrix:**

| NODE_ENV | AUTH_EMAIL_DEV_MODE | Result |
|----------|---------------------|--------|
| development | not set | Dev mode (console only) |
| development | "true" | Dev mode (console only) |
| development | "false" | **Production mode (sends email)** |
| production | any | Production mode (sends email) |

## Testing

```bash
# Development with real email
AUTH_EMAIL_DEV_MODE=false pnpm dev
# Request magic link - should send real email

# Development default
pnpm dev
# Request magic link - should only log to console
```

## Labels

`auth`, `P3`
```

---

## Quick Reference: `gh issue create` Commands

```bash
# N3.1
gh issue create \
  --title "N3.1: Secure Demo Mode Isolation" \
  --label "auth,security,P0" \
  --body-file docs/issues/n3-1-demo-mode.md

# N3.2
gh issue create \
  --title "N3.2: Auth Security Hardening" \
  --label "auth,security,P0" \
  --body-file docs/issues/n3-2-security.md

# N3.3
gh issue create \
  --title "N3.3: Auth Code Cleanup" \
  --label "cleanup,auth,P2" \
  --body-file docs/issues/n3-3-cleanup.md

# N3.4
gh issue create \
  --title "N3.4: Fix Email Dev Mode Logic" \
  --label "auth,P3" \
  --body-file docs/issues/n3-4-email-fix.md
```

Or create inline:

```bash
# N3.1 - Secure Demo Mode Isolation
gh issue create --title "N3.1: Secure Demo Mode Isolation" --label "auth,security,P0" --body "$(cat << 'EOF'
## Summary
Prevent demo mode from running in production and consolidate demo flags.

## Acceptance Criteria
- [ ] App throws error if `ENABLE_DEMO_MODE=true` in production
- [ ] `isDemoModeEnabled()` returns false in production
- [ ] `/demo-signin` redirects to `/signin` in production
- [ ] Demo Credentials provider not registered in production

## Files
- `auth.ts`
- `src/lib/demo-mode.ts`
- `src/app/demo-signin/page.tsx`
EOF
)"

# N3.2 - Auth Security Hardening
gh issue create --title "N3.2: Auth Security Hardening" --label "auth,security,P0" --body "$(cat << 'EOF'
## Summary
Fix unauthenticated catalog API and spoofable cron job auth.

## Acceptance Criteria
- [ ] `GET /api/catalog` returns 401 for unauthenticated requests
- [ ] Cron job requires `CRON_SECRET` in production
- [ ] Document `CRON_SECRET` in `.env.example`

## Files
- `src/app/api/catalog/route.ts`
- `src/app/api/jobs/payment-retry/route.ts`
- `.env.example`
EOF
)"

# N3.3 - Auth Code Cleanup
gh issue create --title "N3.3: Auth Code Cleanup" --label "cleanup,auth,P2" --body "$(cat << 'EOF'
## Summary
Remove unused auth components, hooks, and legacy demo UI.

## Files to Delete
- `src/components/auth/auth-guard.tsx`
- `src/components/auth/role-guard.tsx`
- `src/components/shared/role-gate.tsx`
- `src/components/shared/__tests__/role-gate.test.tsx`
- `src/hooks/use-require-auth.ts`
- `src/hooks/use-require-role.ts`

## Files to Modify
- `src/app/signin/page.tsx` (remove legacy dev login UI)
- `docs/ENV_SETUP.md`, `VERCEL_DEPLOY.md`, `PROJECT_STATUS.md`

## Depends On
N3.1
EOF
)"

# N3.4 - Fix Email Dev Mode Logic
gh issue create --title "N3.4: Fix Email Dev Mode Logic" --label "auth,P3" --body "$(cat << 'EOF'
## Summary
Fix `||` vs `&&` bug preventing real email testing in development.

## Acceptance Criteria
- [ ] `AUTH_EMAIL_DEV_MODE="false"` sends real emails in development
- [ ] Default behavior unchanged

## Files
- `auth.ts` (line 95-97)
- `.env.example`
EOF
)"
```

---

*Generated from AUTH_AUDIT_N3.md*
