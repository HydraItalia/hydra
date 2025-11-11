# PDF to CSV Conversion Prompts

Use these prompts to convert the remaining PDF price lists into CSV format using Claude.

## Instructions

1. Open Claude (claude.ai) in a new conversation
2. Attach the PDF file
3. Copy/paste the prompt below (for the specific vendor)
4. Save the resulting CSV to `prisma/seed-data/vendors/` with the specified filename

---

## 1. Ortofrutta Roma S.r.l. (Produce)

**PDF File:** `Listino ortofrutta settimana 11-16 agosto.pdf`

**Prompt:**

```
Task: Convert the attached PDF into a normalized CSV for Hydra's catalog.
Vendor name: Ortofrutta Roma S.r.l.
Default category: Produce
Output file name: ortofrutta_products.csv

CSV columns (exact header, exact order):
vendor_name,category,name,unit,price_cents,in_stock,product_code,source_price_raw

Rules:

1. vendor_name = Ortofrutta Roma S.r.l. on every row.
2. category = Produce unless the line clearly indicates a more specific category we can infer (e.g., "Organic Produce", "Fruits", "Vegetables").
3. name = full product name as shown (variety + size if included).
4. Price parsing (EU formatting → cents):
   * Interpret commas as decimals and dots as thousands.
   * Examples: € 3,47 → 347, 1.234,56 → 123456, 12 → 1200.
   * If the value cannot be parsed or looks wrong, flag it in a short "issues" section at the end AND still include the row with price_cents blank.
   * Always include original string in source_price_raw.
5. unit normalization (best effort):
   * Recognize common patterns: Kg, g, L, ml, cl, Bottle, Tray, Piece, Case of N × size (e.g., Case of 24 × 0.5L).
   * If unknown, set Unit.
6. in_stock = true by default.
7. product_code = vendor SKU/ID if present; otherwise blank.
8. Return only a single CSV (no markdown formatting around it).

Validation & summary:
* Confirm row count and total unique product names.
* List any rows where price couldn't be parsed.
* Show the first 10 rows inline as a preview.
```

**Save as:** `prisma/seed-data/vendors/ortofrutta_products.csv`

---

## 2. Moon Ray Distributors (Beverage)

**PDF File:** `LISTINO PREZZI 2025 moon ray.pdf`

**Prompt:**

```
Task: Convert the attached PDF into a normalized CSV for Hydra's catalog.
Vendor name: Moon Ray Distributors
Default category: Beverage
Output file name: moonray_products.csv

CSV columns (exact header, exact order):
vendor_name,category,name,unit,price_cents,in_stock,product_code,source_price_raw

Rules:

1. vendor_name = Moon Ray Distributors on every row.
2. category = Beverage unless the line clearly indicates a more specific category (e.g., "Wine", "Spirits", "Beer", "Soft Drinks").
3. name = full product name as shown (brand + product name + size).
4. Price parsing (EU formatting → cents):
   * Interpret commas as decimals and dots as thousands.
   * Examples: € 3,47 → 347, 1.234,56 → 123456, 12 → 1200.
   * If the value cannot be parsed or looks wrong, flag it in a short "issues" section at the end AND still include the row with price_cents blank.
   * Always include original string in source_price_raw.
5. unit normalization (best effort):
   * Recognize common patterns: Kg, g, L, ml, cl, Bottle, Tray, Piece, Case of N × size (e.g., Case of 24 × 0.5L).
   * For bottles, try to extract size (e.g., "0.75L Bottle", "750ml Bottle").
   * If unknown, set Unit.
6. in_stock = true by default.
7. product_code = vendor SKU/ID if present; otherwise blank.
8. Return only a single CSV (no markdown formatting around it).

Validation & summary:
* Confirm row count and total unique product names.
* List any rows where price couldn't be parsed.
* Show the first 10 rows inline as a preview.
```

**Save as:** `prisma/seed-data/vendors/moonray_products.csv`

---

## 3. MicroKush Botanicals (Specialty Produce)

**PDF File:** `listino microkush.pdf`

**Prompt:**

```
Task: Convert the attached PDF into a normalized CSV for Hydra's catalog.
Vendor name: MicroKush Botanicals
Default category: Specialty Produce
Output file name: microkush_products.csv

CSV columns (exact header, exact order):
vendor_name,category,name,unit,price_cents,in_stock,product_code,source_price_raw

Rules:

1. vendor_name = MicroKush Botanicals on every row.
2. category = Specialty Produce unless the line clearly indicates a more specific category (e.g., "Microgreens", "Herbs", "Edible Flowers").
3. name = full product name as shown (variety + growing method if included).
4. Price parsing (EU formatting → cents):
   * Interpret commas as decimals and dots as thousands.
   * Examples: € 3,47 → 347, 1.234,56 → 123456, 12 → 1200.
   * If the value cannot be parsed or looks wrong, flag it in a short "issues" section at the end AND still include the row with price_cents blank.
   * Always include original string in source_price_raw.
5. unit normalization (best effort):
   * Recognize common patterns: Kg, g, L, ml, cl, Bottle, Tray, Piece, Case of N × size (e.g., Case of 24 × 0.5L).
   * For microgreens/herbs, common units are: g, Kg, Tray, Piece.
   * If unknown, set Unit.
6. in_stock = true by default.
7. product_code = vendor SKU/ID if present; otherwise blank.
8. Return only a single CSV (no markdown formatting around it).

Validation & summary:
* Confirm row count and total unique product names.
* List any rows where price couldn't be parsed.
* Show the first 10 rows inline as a preview.
```

**Save as:** `prisma/seed-data/vendors/microkush_products.csv`

---

## After Converting All PDFs

Once you have all 7 CSV files in `prisma/seed-data/vendors/`:

1. white_dog_products.csv ✅ (already provided)
2. cd_fish_products.csv ✅ (already provided)
3. general_beverage_products.csv ✅ (already provided)
4. plustik_products.csv ✅ (already provided)
5. ortofrutta_products.csv ⏳ (to generate)
6. moonray_products.csv ⏳ (to generate)
7. microkush_products.csv ⏳ (to generate)

Run the import:

```bash
# Reset catalog data (keeps users/auth)
pnpm tsx scripts/reset-catalog.ts

# Import all CSV files
pnpm tsx scripts/import-vendors.ts

# Verify in Prisma Studio
npx prisma studio
```

Then open your app at `/dashboard/catalog` to see real vendor data!
