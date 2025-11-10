# Vercel Deployment Guide

Quick reference for deploying Hydra to Vercel with the HydraItalia/hydra repository.

---

## Prerequisites

- GitHub repository: `HydraItalia/hydra` ✅
- Vercel account connected to GitHub
- Neon PostgreSQL database (production instance)
- SMTP provider (Resend recommended for production)

---

## Step 1: Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables for **Production** environment:

### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Use production Neon instance (NOT dev!) |
| `AUTH_SECRET` | Generate new: `openssl rand -base64 32` | **MUST be different from dev!** |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your actual production domain |
| `EMAIL_SERVER` | `smtp://resend:re_YOUR_KEY@smtp.resend.com:587` | Production SMTP (Resend/SendGrid) |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Verified sender domain |

### Important Security Notes

- ✅ DO use a **separate Neon database** for production
- ✅ DO generate a **new AUTH_SECRET** (don't reuse dev secret!)
- ✅ DO use production SMTP (not Mailtrap)
- ❌ DO NOT set `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` in production
- ❌ DO NOT use the same database as development

---

## Step 2: Connect Repository

1. **In Vercel Dashboard**:
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose **HydraItalia/hydra**

2. **Configure Build Settings**:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install`

3. **Root Directory**: Leave as `.` (root)

4. **Click "Deploy"**

---

## Step 3: Run Production Migrations

After the first deployment, you need to run migrations on your production database.

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Pull production environment variables
vercel env pull .env.production

# Run migrations using production DATABASE_URL
dotenv -e .env.production -- npx prisma migrate deploy

# Optional: Seed production database
dotenv -e .env.production -- npx tsx prisma/seed.ts
```

### Option B: Update Build Command

In Vercel → Settings → Build & Development Settings:

**Build Command**:
```bash
npx prisma migrate deploy && npm run build
```

This runs migrations automatically on every deployment.

---

## Step 4: Verify Deployment

### Check Build Logs

1. Go to Vercel → Deployments → Latest deployment
2. Click "View Function Logs"
3. Verify:
   - ✅ Prisma migrations applied successfully
   - ✅ No environment variable errors
   - ✅ Build completed without errors

### Test Production Site

1. **Visit your production URL**: `https://your-app.vercel.app`
2. **Navigate to sign-in**: `/signin`
3. **Verify**:
   - ✅ Demo login buttons **should NOT appear**
   - ✅ Magic link form is visible
   - ✅ Page loads without errors

4. **Test Authentication**:
   - Enter a real email address
   - Check your email for magic link
   - Click link and verify you're signed in
   - Check you're redirected to dashboard

---

## Step 5: Auto-Deploy Configuration

Vercel automatically deploys:

- **Main branch** → Production deployment
- **Dev branch** → Preview deployment (optional)
- **Pull Requests** → Preview deployments

### Configure Branch Deployments

In Vercel → Settings → Git:

- **Production Branch**: `main`
- **Preview Branches**: Enable for `dev` (optional)
- **PR Comments**: Enable automatic preview links

---

## Troubleshooting

### Build Fails: "Can't reach database server"

**Cause**: DATABASE_URL is incorrect or not set

**Fix**:
1. Go to Vercel → Settings → Environment Variables
2. Verify DATABASE_URL is correct
3. Test connection in Neon dashboard
4. Redeploy

### Build Fails: "No secret provided"

**Cause**: AUTH_SECRET not set

**Fix**:
1. Generate new secret: `openssl rand -base64 32`
2. Add to Vercel environment variables
3. Redeploy

### Emails Not Sending

**Cause**: EMAIL_SERVER or EMAIL_FROM incorrect

**Fix**:
1. Verify SMTP credentials with your provider
2. Ensure sender domain is verified
3. Check Resend/SendGrid logs
4. Test SMTP connection locally first

### Demo Login Buttons Still Showing

**Cause**: `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` is set in production

**Fix**:
1. Go to Vercel → Settings → Environment Variables
2. **Delete** `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` (don't set it at all)
3. Redeploy

### Migration Errors on Deploy

**Cause**: Migrations not in Git or database out of sync

**Fix**:
```bash
# Ensure migrations are committed
git add prisma/migrations
git commit -m "feat: add migrations"
git push

# Or manually run migrations
vercel env pull .env.production
dotenv -e .env.production -- npx prisma migrate deploy
```

### Database Already Exists Errors

**Cause**: Running `migrate dev` in production (should use `migrate deploy`)

**Fix**:
- Always use `prisma migrate deploy` for production
- Never use `prisma migrate dev` or `prisma db push` in production

---

## Production Checklist

Before going live, verify:

### Environment Variables
- [ ] `DATABASE_URL` points to production Neon database
- [ ] `AUTH_SECRET` is unique (different from dev)
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] `EMAIL_SERVER` uses production SMTP
- [ ] `EMAIL_FROM` uses verified domain
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` is **NOT SET**

### Database
- [ ] Production database is separate from dev
- [ ] Migrations applied successfully
- [ ] Seed data loaded (if needed)
- [ ] Can connect via Prisma Studio

### Application
- [ ] Build completes without errors
- [ ] Demo login buttons **NOT VISIBLE** on signin page
- [ ] Magic link emails arrive successfully
- [ ] Authentication flow works end-to-end
- [ ] Dashboard loads after authentication
- [ ] Role-based navigation works

### Security
- [ ] `.env` files not committed to Git
- [ ] AUTH_SECRET never shared
- [ ] Database credentials secure
- [ ] SMTP credentials secure
- [ ] Demo logins disabled

---

## Updating Production

### For Code Changes

```bash
# Make changes on feature branch
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "feat: description"
git push origin feature/new-feature

# Create PR to main
# After review and merge, Vercel auto-deploys
```

### For Schema Changes

```bash
# Create migration locally
pnpm db:migrate
# Name it: "add_new_table"

# Commit migration files
git add prisma/migrations
git commit -m "feat: add new table migration"
git push

# Vercel will run migrations automatically if build command includes:
# npx prisma migrate deploy && npm run build
```

---

## Monitoring

### Check Application Health

- **Vercel Dashboard**: Monitor deployment status, function logs
- **Neon Dashboard**: Monitor database queries, connection pool
- **Email Provider**: Check delivery rates, bounces

### View Logs

```bash
# Install Vercel CLI
npm i -g vercel

# View recent logs
vercel logs

# Follow logs in real-time
vercel logs --follow
```

---

## Rollback

If a deployment breaks production:

1. **In Vercel Dashboard**:
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Or via CLI**:
   ```bash
   vercel rollback
   ```

---

## Additional Resources

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment)
- [Neon Production Guide](https://neon.tech/docs/guides/production-checklist)
- [Resend Production Setup](https://resend.com/docs/send-with-nextjs)

---

## Support

If deployment issues occur:

1. Check Vercel build logs
2. Verify all environment variables
3. Test database connection in Neon dashboard
4. Review migration status: `npx prisma migrate status`
5. Check EMAIL provider logs (Resend/SendGrid)

**Remember**: Never commit secrets or use demo logins in production!
