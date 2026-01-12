# Ghiaccio Puro Vendor Setup

## Summary

Successfully created **Ghiaccio Puro** vendor with 16 ice products based on the provided product catalog.

## Vendor Details

- **Name**: Ghiaccio Puro (Pure Ice)
- **Email**: vendor.ghiacciopuro@hydra.local
- **Phone**: +39 02 1234567
- **Address**: Via del Ghiaccio 123, Milano, Italy
- **Region**: Lombardy
- **Business Hours**: Mon-Fri 6:00-18:00

## Products Imported (16 total)

### Ice Cubes (Weight-based)
1. **Cubetti Gourmet 2kg** - 18gr cubes, 35x31mm - €8.50/kg
2. **Cubetto Hoshizaki 31g** - 2.5kg, 32x32x32mm - €9.50/kg
3. **Cubetto Hoshizaki 23g** - 2kg, 28x28x32mm - €9.00/kg
4. **Ghiaccio Tritato Nugget** - 2.5kg crushed ice - €7.50/kg

### Ice Cubes (Box-based)
5. **Cubo Ghiaccio 5x5cm** - 64pz box - €12.00/box
6. **Cubo Ghiaccio 5x5cm** - 128pz box - €22.00/box
7. **Cubo Ghiaccio 6x5cm** - 64pz box - €13.50/box
8. **Cubo Ghiaccio 6x5cm** - 128pz box - €24.50/box
9. **Cubo Ghiaccio 7x5cm** - 54pz box - €14.00/box
10. **Cubo Ghiaccio 7x5cm** - 112pz box - €27.00/box

### Chunk Ice
11. **Chunk Ice 4x4x12cm** - 50pz box - €15.00/box
12. **Chunk Ice 4x4x12cm** - 100pz box - €28.00/box
13. **Chunk Ice 4x4x10cm** - 50pz box - €14.00/box
14. **Chunk Ice 4x4x10cm** - 100pz box - €26.00/box

### Ice Spheres
15. **Sfere di Ghiaccio Ø45mm** - 17-20pz box - €18.00/box
16. **Sfere di Ghiaccio Ø60mm** - 17-20pz box - €20.00/box

## Demo Sign-In

### Local Testing

1. Navigate to `/demo-signin`
2. Click on **VENDOR** role
3. The demo user list will show "Ghiaccio Puro"
4. System auto-signs you in as: `vendor.ghiacciopuro@hydra.local`

### Vendor View
- Dashboard: `/dashboard/inventory`
- View all 16 products
- Manage stock levels
- Update pricing

### Client View
1. Sign in as CLIENT role (e.g., `client.demo@hydra.local`)
2. Go to `/dashboard/orders/new`
3. Ghiaccio Puro products will appear in the product catalog
4. Can add products to cart and create orders

## Files Created/Modified

### New Files
- `prisma/seed-data/vendors/ghiaccio_puro_products.csv` - Product catalog CSV
- `scripts/setup-ghiaccio-puro-vendor.ts` - Setup script for vendor
- `scripts/verify-ghiaccio-puro.ts` - Verification script
- `docs/ghiaccio-puro-vendor-setup.md` - This documentation

### Modified Files
- `src/lib/demo-mode.ts` - Added Ghiaccio Puro to demo users list

## Production Deployment

### Step 1: Commit Changes

```bash
git add prisma/seed-data/vendors/ghiaccio_puro_products.csv
git add scripts/setup-ghiaccio-puro-vendor.ts
git add scripts/verify-ghiaccio-puro.ts
git add src/lib/demo-mode.ts
git add docs/ghiaccio-puro-vendor-setup.md

git commit -m "feat: add Ghiaccio Puro vendor with ice products

- Added 16 ice products (cubes, spheres, crushed ice, chunk ice)
- Created CSV import for vendor products
- Added demo signin for vendor testing
- Products visible on both vendor and client dashboards

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Step 2: Deploy to Production

Option A: **Run setup script directly on production database**

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run setup script
npx tsx scripts/setup-ghiaccio-puro-vendor.ts

# Verify
npx tsx scripts/verify-ghiaccio-puro.ts
```

Option B: **Use existing import-vendors script**

The CSV will automatically be imported when running:

```bash
npx tsx scripts/import-vendors.ts
```

Then manually create the demo user in production seed script.

### Step 3: Verify Production Setup

1. Check vendor exists in database
2. Verify all 16 products are imported
3. Test demo signin on production
4. Test client can see and order products

## Testing Checklist

- [x] Vendor created in local database
- [x] 16 products imported successfully
- [x] Demo user created and linked to vendor
- [x] Demo signin shows Ghiaccio Puro option
- [x] Vendor dashboard displays products
- [ ] Client can see products in order flow
- [ ] Orders can be created with ice products
- [ ] Production deployment completed
- [ ] Production testing completed

## Notes

- All products set to 100 stock quantity by default
- All products are active and available for ordering
- Products are categorized under "Food" category
- SKU codes follow pattern: ICE-{TYPE}-{VARIANT}
- Prices are estimates based on typical ice product pricing
- No Stripe Connect account configured (chargesEnabled: false)
