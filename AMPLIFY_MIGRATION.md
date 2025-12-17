# AWS Amplify Migration Guide

## Overview
Migrating Hydra from Vercel to AWS Amplify for native RDS PostgreSQL support.

---

## Required Environment Variables

Copy these from your Vercel dashboard and add to Amplify:

### Database (CRITICAL)
```bash
DATABASE_URL="postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/hydra?sslmode=require&connection_limit=5"
DIRECT_URL="postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/hydra?sslmode=require"
```

### Authentication (NextAuth)
```bash
AUTH_SECRET="your-auth-secret-from-vercel"
NEXTAUTH_URL="https://your-amplify-domain.amplifyapp.com"  # Update after deployment
```

### Email (for magic links)
```bash
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="hydra@yourdomain.com"
AUTH_EMAIL_DEV_MODE="false"  # Set to false for production
```

### Demo Mode
```bash
ENABLE_DEMO_MODE="true"
NEXT_PUBLIC_ENABLE_DEMO_MODE="true"
```

### Google Maps (if used)
```bash
GOOGLE_MAPS_API_KEY="your-google-maps-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

---

## Step-by-Step Migration

### 1. Prepare Your Repository

**Current status:**
- ✅ `amplify.yml` created
- ✅ `next.config.ts` is compatible
- ✅ Middleware updated (no Edge runtime issues)
- ✅ RDS database is ready

**Commit and push changes:**
```bash
git add amplify.yml AMPLIFY_MIGRATION.md
git commit -m "feat: add AWS Amplify configuration"
git push origin main
```

---

### 2. Set Up AWS Amplify (Console)

**Go to:** https://console.aws.amazon.com/amplify

**Steps:**
1. Click **"New app"** → **"Host web app"**
2. Choose **GitHub** as your source
3. Authorize AWS Amplify to access your GitHub
4. Select repository: **HydraItalia/hydra**
5. Select branch: **main**
6. Click **Next**

---

### 3. Configure Build Settings

**App name:** `hydra` (or your preference)

**Build settings:**
- Auto-detected from `amplify.yml` ✅
- Framework: **Next.js - SSR**
- Node version: **20** (recommended)

**Advanced settings:**
- Enable SSR logging: **Yes**
- Environment variables: Click **"Add environment variables"**

**Add ALL environment variables from section above**

---

### 4. Configure Advanced Settings

**Service role:**
- If this is your first Amplify app: Create new role
- Otherwise: Use existing `amplifyconsole-backend-role`

**VPC Settings (IMPORTANT for RDS):**
- If RDS is in a VPC (private): Configure VPC access
- If RDS is publicly accessible: No VPC config needed

**To check RDS accessibility:**
```bash
# Try connecting from your machine
psql "your-rds-connection-string"
```

If it works from your machine without VPN = publicly accessible ✅

---

### 5. Deploy

Click **"Save and deploy"**

**What happens:**
1. Amplify clones your repo
2. Runs `npm ci` (install dependencies)
3. Runs `npm run build` (builds Next.js)
4. Deploys to CDN
5. Provides a URL: `https://main.xxxxx.amplifyapp.com`

**Expected time:** 5-10 minutes

---

### 6. Verify Deployment

**Check build logs:**
- Build tab → View logs
- Look for errors (especially Prisma connection)

**Test the deployment:**

```bash
# 1. Test homepage
curl https://your-amplify-url.amplifyapp.com

# 2. Test demo signin
# Open in browser: https://your-amplify-url.amplifyapp.com/demo-signin

# 3. Test RDS connection
# Try logging in as a demo user
```

---

### 7. Update NEXTAUTH_URL

**After first successful deploy:**

1. Go to Amplify console → Environment variables
2. Update `NEXTAUTH_URL` to your actual Amplify URL
3. Trigger redeploy (or wait for next push)

---

### 8. Configure Custom Domain (Optional)

**If you have a custom domain:**

1. Amplify console → Domain management
2. Click **"Add domain"**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration steps
5. Update `NEXTAUTH_URL` to custom domain

---

## Troubleshooting

### Build Fails with "Cannot find module @prisma/client"

**Fix:** Add to `amplify.yml` under `preBuild`:
```yaml
preBuild:
  commands:
    - npm ci
    - npx prisma generate  # Add this
```

### RDS Connection Timeout

**Check:**
1. RDS Security Group allows inbound from Amplify IPs
2. RDS is publicly accessible OR Amplify is in same VPC
3. `DATABASE_URL` has `?sslmode=require`

**Get Amplify IPs:**
- They use AWS IP ranges
- Or configure VPC access in Amplify

### Auth Not Working

**Check:**
1. `AUTH_SECRET` is set correctly
2. `NEXTAUTH_URL` matches your Amplify URL
3. `EMAIL_SERVER` credentials are correct
4. Check Amplify logs for auth errors

---

## Rollback Plan

**If Amplify deployment fails:**

1. Vercel is still running (don't delete yet)
2. Can switch DNS back to Vercel
3. Or debug Amplify issues with logs

**Don't delete Vercel until:**
- ✅ Amplify deploys successfully
- ✅ Auth works
- ✅ RDS connections work
- ✅ Demo login works

---

## Success Checklist

- [ ] Amplify app created
- [ ] GitHub repo connected
- [ ] Environment variables added
- [ ] First deployment succeeded
- [ ] Homepage loads
- [ ] Demo login works
- [ ] RDS connection works
- [ ] Auth works end-to-end
- [ ] Custom domain configured (if applicable)
- [ ] `NEXTAUTH_URL` updated

---

## Next Steps After Migration

1. **Monitor for 24-48 hours**
   - Check error logs in Amplify
   - Test all critical flows
   - Monitor RDS connections

2. **Update DNS (if using custom domain)**
   - Point to Amplify instead of Vercel
   - Update `NEXTAUTH_URL`

3. **Disable Vercel (after 1 week)**
   - Keep as backup for 1 week
   - Then delete to save costs

4. **Set up monitoring**
   - AWS CloudWatch (included)
   - Set up alerts for errors

---

## Cost Estimate

**Monthly costs:**
- Amplify hosting: $20-30
- RDS database: $15-50 (depending on instance)
- Data transfer: $1-5
- **Total: ~$40-85/month**

---

## Support

**If you get stuck:**
- AWS Amplify docs: https://docs.amplify.aws
- AWS Support (if you have a plan)
- Amplify Discord: https://discord.gg/amplify

**Common issues:**
- Build failures → Check build logs in Amplify console
- RDS connection → Check security groups and VPC settings
- Auth issues → Verify environment variables
