# Hydra Import Scripts

Scripts for importing real vendor data into Hydra.

## Scripts

### `reset-catalog.ts`
Wipes all catalog data (vendors, products, categories, orders, etc.) while preserving users and authentication.

```bash
pnpm tsx scripts/reset-catalog.ts
```

### `import-vendors.ts`
Imports vendor products from CSV files in `prisma/seed-data/vendors/`.

```bash
pnpm tsx scripts/import-vendors.ts
```

**Features:**
- Auto-creates vendors, categories, products, and vendor-products
- Normalizes product units (Kg, L, Bottle, Piece, Box, Service)
- Maps categories to CategoryGroups (FOOD, BEVERAGE, SERVICES)
- Handles EU price formatting (commas as decimals)
- Prevents duplicates with upsert logic

## CSV Format

CSV files should have these columns:

```csv
vendor_name,category,name,unit,price_cents,in_stock,product_code,source_price_raw
```

Example:
```csv
White Dog S.r.l.,Beverage,Tequila 1800 Silver 0.7L,0.7L Bottle,2950,true,TEB001,€29.50
```

## Usage Workflow

1. **Place CSV files** in `prisma/seed-data/vendors/`

2. **Reset catalog data** (optional, keeps users/auth):
   ```bash
   pnpm tsx scripts/reset-catalog.ts
   ```

3. **Import vendor data**:
   ```bash
   pnpm tsx scripts/import-vendors.ts
   ```

4. **Verify import**:
   ```bash
   npx prisma studio
   ```

5. **Test in app**:
   Open http://localhost:3000/dashboard/catalog

## Current CSV Files

- ✅ `white_dog_products.csv` - White Dog S.r.l. (Beverages)
- ✅ `cd_fish_products.csv` - CD Fish S.r.l. (Seafood)
- ✅ `general_beverage_products.csv` - General Beverage Distributor
- ✅ `plustik_products.csv` - Plustik Service S.r.l. (Packaging/Services)
- ⏳ `ortofrutta_products.csv` - Ortofrutta Roma (Produce) - needs conversion
- ⏳ `moonray_products.csv` - Moon Ray Distributors (Beverages) - needs conversion
- ⏳ `microkush_products.csv` - MicroKush Botanicals (Specialty Produce) - needs conversion

See `PDF_TO_CSV_PROMPTS.md` for instructions on converting remaining PDFs.

## Category Mapping

The import script automatically maps category names to CategoryGroups:

**BEVERAGE:**
- Beverage, Beverages, Drinks
- Wine, Spirits, Beer

**FOOD:**
- Food, Produce, Seafood, Fish
- Meat, Dairy, Bakery, Pantry, Frozen
- Specialty Produce

**SERVICES:**
- Services, Packaging, Supplies, Disposables

## Unit Normalization

The script normalizes various unit strings to Hydra's ProductUnit enum:

- **KG**: kg, kilogram, kilo
- **L**: l, liter, litre, ml, cl, dl
- **BOX**: box, case, crate
- **PIECE**: bottle, piece, item, unit (default)
- **SERVICE**: service, delivery

## Troubleshooting

**Import fails with "unique constraint" error:**
- Run `pnpm tsx scripts/reset-catalog.ts` first to clear old data

**Products not showing in catalog:**
- Check that `isActive = true` in VendorProduct
- Verify stockQty > 0 or leadTimeDays is set
- Check category is linked to correct CategoryGroup

**Prices look wrong:**
- Verify price_cents are in cents (€12.50 = 1250)
- Check source_price_raw column for original values
- Adjust CSV if prices need correction

## Development

Both scripts use TypeScript and can be run with `tsx` (installed as dev dependency).

To modify:
1. Edit the script files
2. No compilation needed - tsx handles TypeScript on-the-fly
3. Test with a small CSV first
