# Runtime Verification Guide

## Method 1: Vercel Build Logs (Definitive Proof)

### Before the fix:
1. Go to your failing Vercel deployment
2. Click "Deployment" → "Build Logs"
3. Search for: `Route (app)` or `λ` (lambda) or `ƒ` (edge)

**Look for:**
```
Route (app)                              Size     First Load JS
├ ƒ /api/auth/[...nextauth]             <-- ƒ = Edge Function (BAD for RDS)
├ λ /api/catalog                        <-- λ = Node Function (GOOD)
```

### After the fix:
```
Route (app)                              Size     First Load JS
├ λ /api/auth/[...nextauth]             <-- λ = Node Function (GOOD!)
├ λ /api/catalog                        <-- λ = Node Function (GOOD)
```

**Symbols:**
- `ƒ` = Edge Function (no TCP, can't access RDS)
- `λ` = Node.js Function (TCP allowed, RDS works)

---

## Method 2: Add Debug Endpoint

Create this file to test runtime detection:

**File:** `src/app/api/debug/runtime/route.ts`

```typescript
export const runtime = 'nodejs' // Force Node for testing

export async function GET() {
  const runtimeInfo = {
    isEdge: typeof EdgeRuntime !== 'undefined',
    isNode: typeof process !== 'undefined',
    nodeVersion: typeof process !== 'undefined' ? process.version : 'N/A',
    env: typeof process !== 'undefined' ? process.env.VERCEL_ENV : 'N/A',
    canAccessTCP: typeof process !== 'undefined' && 'createConnection' in (await import('net')),
  }

  return Response.json(runtimeInfo)
}
```

**Test:**
- Local: `curl http://localhost:3000/api/debug/runtime`
- Vercel: `curl https://your-app.vercel.app/api/debug/runtime`

**Expected output (Node):**
```json
{
  "isEdge": false,
  "isNode": true,
  "nodeVersion": "v20.x.x",
  "canAccessTCP": true
}
```

**If Edge (BAD):**
```json
{
  "isEdge": true,
  "isNode": false,
  "canAccessTCP": false
}
```

---

## Method 3: Check Vercel Function Logs

1. Go to Vercel dashboard
2. Click "Logs" or "Functions"
3. Look for auth route errors

**Edge runtime error (proves the issue):**
```
Error: The edge runtime does not support Node.js 'net' module
```

or

```
Error: connect ENOTFOUND (RDS endpoint)
```

**Node runtime success:**
```
[auth] User signed in successfully
```

---

## Method 4: Test Prisma Connection in Auth Route

Add temporary debug logging to `auth.ts`:

```typescript
callbacks: {
  async jwt({ token, user }) {
    console.log('[AUTH DEBUG] Runtime:', typeof process !== 'undefined' ? 'Node' : 'Edge')

    if (user) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        console.log('[AUTH DEBUG] DB query succeeded:', !!dbUser)
        // ... rest of code
      } catch (error) {
        console.error('[AUTH DEBUG] DB query failed:', error.message)
        throw error
      }
    }
    return token
  }
}
```

**On Vercel with Edge runtime (BEFORE fix):**
```
[AUTH DEBUG] Runtime: Edge
[AUTH DEBUG] DB query failed: The edge runtime does not support Node.js 'net' module
```

**On Vercel with Node runtime (AFTER fix):**
```
[AUTH DEBUG] Runtime: Node
[AUTH DEBUG] DB query succeeded: true
```

---

## Method 5: Local Edge Runtime Simulation

Test Edge runtime failure locally using `next dev --experimental-https`:

```bash
# Install edge-runtime
npm install -D edge-runtime

# Create test file
cat > test-edge.mjs << 'EOF'
import { EdgeRuntime } from 'edge-runtime'

const runtime = new EdgeRuntime()

const result = await runtime.evaluate(`
  (async () => {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.user.findFirst();
      return 'SUCCESS';
    } catch (error) {
      return 'ERROR: ' + error.message;
    }
  })()
`)

console.log(result) // Should show error about net module
EOF

# Run test
node test-edge.mjs
```

**Expected output (proves Prisma can't run on Edge):**
```
ERROR: The edge runtime does not support Node.js 'net' module
```

---

## Method 6: Check .next Build Output

After building locally:

```bash
npm run build
cat .next/server/app/api/auth/\[...nextauth\]/route.js | head -20
```

**Look for runtime detection:**
```javascript
export const runtime = 'nodejs' // <-- Confirms Node runtime
```

Or check the manifest:
```bash
cat .next/server/middleware-manifest.json | jq '.functions["/api/auth"]'
```

**Should show:**
```json
{
  "runtime": "nodejs"  // <-- Not "edge"
}
```

---

## QUICKEST VERIFICATION (Do This Now)

**Before deploying the fix:**

1. Check your CURRENT Vercel deployment logs
2. Look for this specific error pattern:
   - Auth failures on RDS
   - No errors on Neon
   - Errors mention "edge", "net module", or TCP

3. Deploy the fix to a preview branch
4. Check build logs for `λ` (Node) instead of `ƒ` (Edge) for auth route
5. Test demo login on preview
6. Compare logs: preview should have Node runtime, prod might have Edge

**This will give you 100% certainty BEFORE merging to production.**
