# Environment Setup Guide

Complete guide for configuring environment variables in Hydra for local development and production deployment.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Database Setup (Neon)](#database-setup-neon)
4. [Email Configuration](#email-configuration)
5. [Generating AUTH_SECRET](#generating-auth_secret)
6. [Testing Your Setup](#testing-your-setup)
7. [Production Deployment (Vercel)](#production-deployment-vercel)
8. [Demo Login Configuration](#demo-login-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Fill in Required Values

Edit `.env.local` with your actual credentials:

```env
DATABASE_URL="postgresql://..."  # From Neon dashboard
AUTH_SECRET="..."                # Generate with openssl
EMAIL_SERVER="smtp://..."        # Your SMTP provider
```

### 3. Test Database Connection

```bash
npm run db:migrate
```

If successful, you'll see migration files created and applied.

---

## Environment Variables

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `AUTH_SECRET` | JWT signing key | Generated 32-byte string |
| `NEXTAUTH_URL` | Application base URL | `http://localhost:3000` |
| `EMAIL_SERVER` | SMTP server for magic links | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Sender email address | `noreply@hydra.app` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | Show dev login shortcuts | Not set (disabled) |
| `NODE_ENV` | Environment mode | `development` |

---

## Database Setup (Neon)

### What is Neon?

Neon is a serverless PostgreSQL platform that provides:
- **Instant provisioning** - Database ready in seconds
- **Autoscaling** - Scales to zero when not in use
- **Branching** - Git-like branches for your database
- **Free tier** - 0.5GB storage, perfect for development

### Getting Your Connection String

1. **Sign up for Neon**
   - Go to [neon.tech](https://neon.tech)
   - Create a free account

2. **Create a Project**
   - Click "Create Project"
   - Choose a region (EU Central for this project)
   - Name your project (e.g., "hydra-dev")

3. **Get Connection String**
   - Navigate to your project dashboard
   - Click "Connection Details"
   - Copy the **Pooled Connection** string
   - It looks like:
     ```
     postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
     ```

4. **Add to .env.local**
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_W1exKqThlZB8@ep-damp-resonance-ag5nadjq-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   ```

### Database Branches (Optional)

Neon supports database branching for isolated development:

```bash
# Create a dev branch in Neon dashboard
# Update .env.local with the branch connection string
# Run migrations on the branch
npm run db:migrate
```

This is perfect for testing schema changes without affecting production data.

---

## Email Configuration

### Development: Mailtrap (Recommended)

Mailtrap catches all outgoing emails for testing without sending real emails.

1. **Sign up at [mailtrap.io](https://mailtrap.io)**
   - Free tier: 500 emails/month

2. **Get SMTP Credentials**
   - Go to "Email Testing" → "Inboxes"
   - Select or create an inbox
   - Copy SMTP credentials

3. **Configure .env.local**
   ```env
   EMAIL_SERVER="smtp://1a2b3c4d5e6f7g:9h8i7j6k5l4m3n@smtp.mailtrap.io:2525"
   EMAIL_FROM="hydra@localhost.dev"
   ```

4. **Test Magic Links**
   - Sign in with any email
   - Check Mailtrap inbox for the magic link
   - Magic links are logged to console in development

### Production: Resend (Recommended)

Resend provides a modern email API with generous free tier.

1. **Sign up at [resend.com](https://resend.com)**
   - Free tier: 100 emails/day

2. **Get API Key**
   - Go to "API Keys"
   - Create a new key
   - Copy the key (starts with `re_`)

3. **Configure in Vercel**
   ```env
   EMAIL_SERVER="smtp://resend:re_YOUR_API_KEY@smtp.resend.com:587"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

### Alternative: Gmail (Not Recommended)

For quick testing only. Not suitable for production.

1. **Enable 2FA** on your Google account
2. **Create App Password**
   - Google Account → Security → 2-Step Verification
   - App passwords → Generate
3. **Configure**
   ```env
   EMAIL_SERVER="smtp://your-email@gmail.com:YOUR_APP_PASSWORD@smtp.gmail.com:587"
   ```

**⚠️ Warning**: Gmail has strict sending limits and may flag your app.

---

## Generating AUTH_SECRET

The `AUTH_SECRET` is used by NextAuth to sign and encrypt JWTs.

### Using OpenSSL (Recommended)

```bash
openssl rand -base64 32
```

Output example:
```
nWBh+l8FGSpsPY2TCUjFGk17ETGWafkavoo93RR1JRY=
```

Copy this value to `.env.local`:

```env
AUTH_SECRET="nWBh+l8FGSpsPY2TCUjFGk17ETGWafkavoo93RR1JRY="
```

### Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Using Online Generator

Visit [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

### Important Notes

- **Use different secrets** for dev, staging, and production
- **Never commit** `AUTH_SECRET` to Git
- **Regenerate secrets** if compromised
- **Minimum length**: 32 bytes (base64 encoded = ~44 characters)

---

## Testing Your Setup

### 1. Verify Environment Variables

```bash
# Check that .env.local exists
ls -la .env.local

# Verify DATABASE_URL is set (don't print the value!)
node -e "require('dotenv').config({path:'.env.local'}); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing')"
```

### 2. Test Database Connection

Generate Prisma Client:

```bash
npx prisma generate
```

Test connection and create tables:

```bash
npm run db:migrate
```

Expected output:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "neondb"

Applying migration `20231110_initial`

✔ Generated Prisma Client
```

### 3. Seed Database

Populate with demo data:

```bash
npm run db:reset
```

Expected output:
```
🌱 Starting seed...
🧹 Cleaning existing data...
👥 Creating users...
🏪 Creating vendors...
...
✅ Seed completed successfully!
```

### 4. Test Authentication

Start the dev server:

```bash
npm run dev
```

Visit http://localhost:3000/signin

**If using Mailtrap:**
- Enter any email address
- Click "Send magic link"
- Check Mailtrap inbox
- Click the magic link
- Should redirect to dashboard

**If demo login enabled:**
- Click a demo login button
- Check console/Mailtrap for magic link
- Click to authenticate

### 5. Verify Database with Prisma Studio

Open Prisma Studio to browse your database:

```bash
npm run db:studio
```

This opens a web interface at http://localhost:5555 where you can:
- Browse all tables
- View seeded data
- Edit records
- Run queries

---

## Production Deployment (Vercel)

### 1. Create Neon Production Database

**Option A: Separate Production Database (Recommended)**
- Create a new Neon project for production
- Keeps prod data isolated from dev

**Option B: Production Branch**
- In your dev Neon project, create a "production" branch
- Neon creates an isolated copy

### 2. Configure Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | Your Neon production connection string | Production |
| `AUTH_SECRET` | **NEW** secret (different from dev!) | Production |
| `NEXTAUTH_URL` | Your production URL (e.g., `https://hydra.vercel.app`) | Production |
| `EMAIL_SERVER` | Production SMTP (Resend recommended) | Production |
| `EMAIL_FROM` | Production email (e.g., `noreply@hydra.app`) | Production |

**Important:**
- ✅ DO use different `AUTH_SECRET` for production
- ✅ DO use production SMTP (not Mailtrap)
- ✅ DO use your actual domain for `NEXTAUTH_URL`
- ❌ DO NOT set `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` in production
- ❌ DO NOT use the same database for dev and production

### 3. Run Production Migrations

Vercel automatically runs `npm run build`, but migrations must be run manually:

**Option A: Vercel CLI**
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

**Option B: In Vercel Build Settings**

Add to Build Command:
```bash
npx prisma migrate deploy && npm run build
```

Or use a custom build script in `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 4. Verify Deployment

1. **Check build logs** for migration success
2. **Visit your production URL**
3. **Test authentication** with a real email
4. **Verify no demo login buttons** appear

---

## Demo Login Configuration

Demo login shortcuts allow quick authentication during development.

### Enabling Demo Login

In `.env.local`:

```env
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="1"
```

This shows buttons on the signin page:
- Admin
- Agent (Andrea)
- Vendor
- Client

### Disabling Demo Login

**For production, you MUST disable demo logins:**

1. **Remove from Vercel environment variables**
   - Do not set `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`

2. **Or explicitly disable:**
   ```env
   NEXT_PUBLIC_ENABLE_DEMO_LOGIN="0"
   ```

### How It Works

The signin page checks:

```typescript
const isDev = process.env.NODE_ENV !== 'production' &&
              process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === '1'
```

Demo login buttons only appear when **both**:
- Environment is not production
- Feature flag is explicitly enabled

### Security Note

⚠️ **Never enable demo logins in production!**

Demo logins use real user accounts from your seed data. If enabled in production:
- Anyone can log in as admin
- All data is accessible
- Major security vulnerability

---

## Troubleshooting

### "Error: P1001: Can't reach database server"

**Cause**: Database connection failed

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check Neon database is running (it may have scaled to zero)
3. Verify SSL parameters: `?sslmode=require`
4. Test connection in Neon dashboard

### "Error: Invalid `prisma.xxx()` invocation"

**Cause**: Prisma Client not generated or out of sync

**Solution:**
```bash
npx prisma generate
```

### "Auth Error: No secret provided"

**Cause**: `AUTH_SECRET` not set

**Solution:**
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env.local`
3. Restart dev server

### "Email not sending"

**Development (Mailtrap):**
1. Check SMTP credentials are correct
2. Verify inbox exists in Mailtrap
3. Check console logs for magic link URL

**Production:**
1. Verify email provider credentials
2. Check sender domain is verified
3. Check spam folder
4. Review email provider logs

### "Demo login buttons not showing"

**Check:**
1. `NEXT_PUBLIC_ENABLE_DEMO_LOGIN="1"` is set in `.env.local`
2. Server is running in development mode
3. Hard refresh browser (Cmd+Shift+R)
4. Clear Next.js cache: `rm -rf .next`

### "Migration failed"

**Common causes:**
1. Database already has conflicting schema
2. Previous migration interrupted

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Or create a new migration
npx prisma migrate dev --name fix_schema
```

### "Vercel deployment fails"

**Check:**
1. All environment variables are set in Vercel
2. `DATABASE_URL` points to production database
3. Build logs for specific error
4. Prisma Client is generated during build

---

## Environment Variables Checklist

Use this checklist to verify your setup:

### Local Development (.env.local)

- [ ] `DATABASE_URL` set with Neon connection string
- [ ] `AUTH_SECRET` generated (32+ bytes)
- [ ] `NEXTAUTH_URL` set to `http://localhost:3000`
- [ ] `EMAIL_SERVER` configured (Mailtrap or other)
- [ ] `EMAIL_FROM` set to valid email
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_LOGIN="1"` set
- [ ] File is in `.gitignore`
- [ ] Database connection tested (`npm run db:migrate`)
- [ ] Seed data loaded (`npm run db:reset`)

### Production (Vercel)

- [ ] `DATABASE_URL` set to **production** database
- [ ] `AUTH_SECRET` generated (different from dev!)
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `EMAIL_SERVER` uses production SMTP (Resend/SendGrid)
- [ ] `EMAIL_FROM` uses verified domain
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` **NOT SET** or set to "0"
- [ ] Migrations deployed successfully
- [ ] Test authentication with real email
- [ ] Demo login buttons **NOT VISIBLE**

---

## Quick Reference Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migrations
npm run db:migrate

# Reset database and seed
npm run db:reset

# Open Prisma Studio
npm run db:studio

# Generate AUTH_SECRET
openssl rand -base64 32

# Test database connection
npx prisma db pull

# Format Prisma schema
npx prisma format

# View migration status
npx prisma migrate status
```

---

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Mailtrap Documentation](https://mailtrap.io/docs)
- [Resend Documentation](https://resend.com/docs)

---

## Need Help?

If you encounter issues not covered here:

1. Check the application logs
2. Review Prisma migration logs
3. Test database connection in Neon dashboard
4. Verify environment variables are loaded
5. Check Next.js build logs in Vercel

**Security reminder:** Never share your `AUTH_SECRET`, database credentials, or API keys in public channels.
