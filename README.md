# Hydra - Restaurant Supply Procurement Platform

Hydra is a modern procurement platform designed for the HORECA sector, connecting restaurants with multiple vendors for streamlined ordering and inventory management.

## Features

- **Multi-vendor Catalog**: Browse products from multiple vendors in one place
- **Role-based Access**: Separate portals for Admins, Agents, Vendors, and Clients
- **Smart Pricing**: Client-specific agreements with discounts and custom pricing
- **Order Management**: Complete order lifecycle from cart to delivery
- **Inventory Tracking**: Real-time stock levels and lead times
- **Audit Trails**: Full tracking of changes and actions

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: NextAuth.js v5 with email magic links
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Email service (Resend, SMTP, etc.)

### Using Neon Database

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Create a development branch (optional but recommended)
4. Copy the connection string from the dashboard
   - Format: `postgresql://user:password@ep-xxxxx.neon.tech/neondb?sslmode=require`
5. Add the connection string to your `.env` file as `DATABASE_URL`

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database - Neon Postgres
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/neondb?sslmode=require

# NextAuth
AUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Email
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=hydra@localhost.dev
```

3. Initialize the database:

```bash
# Create migration and seed database
npm run db:migrate

# Or reset and seed from scratch
npm run db:reset
```

4. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

The platform uses the following key entities:

- **User**: Accounts with roles (ADMIN, AGENT, VENDOR, CLIENT)
- **Vendor**: Suppliers with inventory
- **Client**: Restaurant customers
- **Product**: Base product catalog
- **VendorProduct**: Vendor-specific SKUs with pricing and stock
- **Agreement**: Client-vendor pricing agreements
- **Cart/Order**: Shopping and order management
- **AuditLog**: Change tracking

See `prisma/schema.prisma` for the complete data model.

## Project Structure

```
hydra/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   └── lib/               # Utilities and helpers
├── vitest.config.ts       # Test configuration
└── package.json
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed database with demo data
- `npm run db:reset` - Reset database and re-seed
- `npm run db:studio` - Open Prisma Studio

## Deployment

### 1. Database Setup

**Option A: Neon (Recommended)**
1. Create a production branch in your Neon project
2. Copy the connection string
3. Add to your deployment environment as `DATABASE_URL`

**Option B: Vercel Postgres**
1. In your Vercel project, go to Storage → Create Database
2. Select Postgres
3. Copy the connection strings

### 2. Configure Environment Variables

Add these in your deployment settings:

- `DATABASE_URL` (Neon connection string)
- `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` (your production URL)
- `EMAIL_SERVER` (SMTP connection string)
- `EMAIL_FROM` (sender email address)

### 3. Deploy

```bash
vercel deploy --prod
```

### 4. Run Migrations

After deployment, run migrations:

```bash
npx prisma migrate deploy
```

### 5. Create Initial Admin User

Use Prisma Studio or a temporary endpoint to create your first admin user.

## Development Workflow

### Reset Database

To start fresh with seed data:

```bash
npm run db:reset
```

### Run Tests

```bash
npm test              # Run all tests
npm run test:ui       # Run with UI
```

### Database Management

```bash
npm run db:studio     # Open Prisma Studio
```

## Business Model

Hydra serves three main sectors (from the diagram):

1. **HORECA** (Food/Beverage): Distillati, soft drinks, wines, beers, coffee, bar tools, produce, meat, fish, artisan baked goods
2. **Services**: Safety operators, maintenance, external admin, local renovations, social media, stamps, HCCP, licenses, disinfections, 3D surveys

### Key Players

- **Ufficio Hydra**: Central office handling order routing and management
- **Agents** (Andrea, Manuele): Individual agents managing client relationships
- **Vendors**: Freezco, Ghiaccio Facile, Icelike, Ghiaccio Extra, etc.
- **Clients**: Restaurants and HORECA businesses

### Regions

Initially focused on **Sardegna** with plans to expand.

## Status

**Step 1 Complete**: Base setup with Next.js, TypeScript, Prisma schema, and initial configuration.

### Next Steps

- [ ] Configure NextAuth with email magic link
- [ ] Create database seed data
- [ ] Build Admin/Agent dashboard
- [ ] Build Vendor portal
- [ ] Build Client portal
- [ ] Implement order workflow
- [ ] Add comprehensive tests

## License

Private - All rights reserved

## Support

For issues or questions, contact the development team.
