# Phase 12 Discovery/Spike: Italian VAT (IVA) + Platform Fee Accounting

**Date:** 2026-01-17
**Status:** Discovery Complete - Ready for Implementation Planning
**Author:** Claude (Staff/Principal Engineer Spike)

---

## Executive Summary

This document provides a comprehensive audit of Hydra's current state regarding:

1. Product categories/taxonomy
2. Vendor file ingestion pipelines
3. Order/SubOrder financial structure
4. Proposed architecture for Italian VAT (IVA) and platform fee tracking

**Key Findings:**

- Categories exist but are minimal (3 groups, ~16 categories) with no VAT classification
- Vendor imports use CSV with varying quality; no raw category preservation
- Orders/SubOrders have fee tracking fields but no VAT fields
- No application_fee_amount used yet (fees tracked but not deducted)
- Direct Charges with transfer_data.destination is implemented

---

## 1. Current Taxonomy State (Evidence-Based Audit)

### 1.1 Schema Models

**File:** `prisma/schema.prisma`

```
CategoryGroup (lines 116-122)
├── id: String @id
├── name: CategoryGroupType @unique  // FOOD, BEVERAGE, SERVICES
├── createdAt, updatedAt
└── ProductCategory[] (one-to-many)

ProductCategory (lines 419-430)
├── id: String @id
├── groupId: String (FK → CategoryGroup)
├── name: String
├── slug: String @unique
├── createdAt, updatedAt
└── Product[] (one-to-many)

Product (lines 402-417)
├── id: String @id
├── categoryId: String (FK → ProductCategory)
├── name: String
├── description: String?
├── unit: ProductUnit (KG, L, PIECE, BOX, SERVICE)
├── imageUrl: String?
├── createdAt, updatedAt, deletedAt
└── VendorProduct[] (one-to-many)
```

**Enum:** `CategoryGroupType` (lines 538-542)

```prisma
enum CategoryGroupType {
  FOOD
  BEVERAGE
  SERVICES
}
```

### 1.2 Category Data Sources

**Seeding scripts:**
| Script | Purpose | Location |
|--------|---------|----------|
| `scripts/seed-categories.ts` | Creates 16 canonical categories across 3 groups | Hardcoded list |
| `scripts/assign-product-categories.ts` | Keyword-based category assignment from product names | 160+ keywords mapped |
| `prisma/seed.ts` | Main seed with CSV import + categories | Uses `categoryGroupMap` |
| `scripts/import-vendors.ts` | CSV import with category creation | Dynamic category creation |
| `prisma/import-csv-products.ts` | Alternative CSV importer | Same pattern |

**Canonical Categories (from `seed-categories.ts`):**

| Group    | Categories                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| FOOD     | Meat & Poultry, Seafood, Dairy & Eggs, Produce, Bakery & Bread, Frozen Foods, Dry Goods & Pantry, Condiments & Sauces |
| BEVERAGE | Alcoholic Beverages, Soft Drinks, Coffee & Tea, Juices, Water                                                         |
| SERVICES | Cleaning & Disposables, Equipment & Supplies, Uniforms & Linens                                                       |

### 1.3 Category Usage in Codebase

| File                                         | Usage                                        |
| -------------------------------------------- | -------------------------------------------- |
| `src/lib/loaders/categories.ts`              | Cached category fetching for UI              |
| `src/data/catalog.ts`                        | Catalog queries filter by group/categorySlug |
| `src/components/catalog/catalog-sidebar.tsx` | UI for browsing by group/category            |
| `src/components/catalog/catalog-filters.tsx` | Filter chips                                 |
| `src/app/api/catalog/route.ts`               | API endpoint for catalog                     |

### 1.4 Health Report (Analysis Based on Code)

**Current State Observations:**

- **CategoryGroup to VAT mapping:** NONE - no VAT rate or classification exists
- **Product.categoryId:** Required field (non-nullable) - all products have a category
- **VendorProduct:** No category override - inherits from Product
- **OrderItem:** No category snapshot - only `productName` and `vendorName` stored

**Missing for VAT:**

- No `vatRatePercent` field on Product, VendorProduct, or Category
- No `vatClassification` enum (STANDARD, REDUCED, SUPER_REDUCED, EXEMPT)
- No snapshot of VAT rate at order time

### 1.5 Data Quality Issues Observed in CSVs

From vendor CSV files:

| File                            | Issues Found                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `cd_fish_products.csv`          | Row 92: "IVA ESCLUSA" embedded in product name (tax-related data in wrong field) |
| `cd_fish_products.csv`          | Inconsistent units: `Unit`, `g`, `Kg`, `Piece` for same category                 |
| `cd_fish_products.csv`          | Price outliers: `16` cents, `17` cents (likely data entry errors)                |
| `general_beverage_products.csv` | Very long product names with embedded metadata                                   |
| `white_dog_products.csv`        | Generic product names like "0,700 lt TEB001"                                     |
| `plustik_products.csv`          | Units in wrong format: `g`, `ml` instead of standardized                         |

---

## 2. Vendor File / Import Pipeline Inventory

### 2.1 Ingestion Paths

| Path                        | File                                    | Method                   | Notes                       |
| --------------------------- | --------------------------------------- | ------------------------ | --------------------------- |
| **CSV Import (Main)**       | `prisma/seed.ts`                        | `importVendorsFromCSV()` | Primary path during seeding |
| **CSV Import (Standalone)** | `scripts/import-vendors.ts`             | Direct execution         | Same logic as seed          |
| **CSV Import (Legacy)**     | `prisma/import-csv-products.ts`         | Alternative parser       | Different CSV parsing       |
| **Manual Vendor Setup**     | `scripts/setup-ghiaccio-puro-vendor.ts` | Script + CSV             | Vendor-specific script      |

### 2.2 Field Matrix

**Expected CSV Schema:**

```
vendor_name,category,name,unit,price_cents,in_stock,product_code,source_price_raw
```

| Field              | Required | Validation | Normalization                        |
| ------------------ | -------- | ---------- | ------------------------------------ |
| `vendor_name`      | Yes      | Non-empty  | Trim, upsert vendor                  |
| `category`         | Yes      | Non-empty  | Slugify, map to CategoryGroup        |
| `name`             | Yes      | Non-empty  | Trim only                            |
| `unit`             | No       | Any string | `normalizeUnit()` → ProductUnit enum |
| `price_cents`      | Yes      | Integer    | `parseInt()`, 0 if invalid           |
| `in_stock`         | No       | "true"/"1" | Boolean                              |
| `product_code`     | No       | Any        | Falls back to generated SKU          |
| `source_price_raw` | No       | Any        | **NOT USED**                         |

### 2.3 Category Derivation Logic

**From `import-vendors.ts` (lines 28-55):**

```typescript
const categoryGroupMap: Record<string, CategoryGroupType> = {
  Beverage: "BEVERAGE",
  Beverages: "BEVERAGE",
  Drinks: "BEVERAGE",
  // ... 20+ mappings
};
```

**Problems:**

1. Case-sensitive matching (e.g., "beverage" won't match)
2. No preservation of original vendor category string
3. Categories auto-created if not in map (defaults to FOOD)
4. No "unmapped" flagging or review queue

### 2.4 Unit Normalization Logic

**From `import-vendors.ts` (lines 55-83):**

```typescript
function normalizeUnit(unitStr: string): ProductUnit {
  // Checks for: kg, kilogram, l, liter, ml, cl, box, case, crate, service, delivery
  // Default: PIECE
}
```

**Problems:**

1. "0.5L Unit" → becomes `L` (loses quantity info)
2. "g" → becomes `KG` (incorrect conversion)
3. "ml" → becomes `L` (loses precision)
4. No pack size preservation (e.g., "CRT 24" lost)

---

## 3. VAT / Tax + Platform Fee Architecture Recommendation

### 3.1 Current Financial Fields (Schema Analysis)

**SubOrder (lines 329-378):**

```prisma
model SubOrder {
  // ... existing fields
  subTotalCents       Int

  // Payment tracking (Phase 11)
  stripeChargeId      String?
  paidAt              DateTime?
  paymentStatus       PaymentStatus?

  // Fee tracking (accounting separation - Phase 11)
  hydraFeeCents       Int?      // Calculated Hydra platform fee
  hydraFeePercent     Float?    // Fee percentage applied (e.g., 0.05)
}
```

**OrderItem (lines 381-400):**

```prisma
model OrderItem {
  id              String
  orderId         String
  vendorProductId String
  qty             Int
  unitPriceCents  Int
  lineTotalCents  Int
  productName     String   // Snapshot
  vendorName      String   // Snapshot
  subOrderId      String?
  // NO VAT fields!
}
```

### 3.2 Proposed VAT Schema Additions

#### Option A: VAT on Category (Recommended for Italy)

```prisma
// New enum
enum VatClassification {
  STANDARD       // 22% - General goods
  REDUCED        // 10% - Food, restaurants
  SUPER_REDUCED  // 4%  - Essential food items
  EXEMPT         // 0%  - Medical, education
}

// Add to ProductCategory
model ProductCategory {
  // ... existing
  vatClassification VatClassification @default(REDUCED)
  vatRatePercent    Float @default(10.0)
}
```

**Justification:**

- Italy VAT is category-based (food vs alcohol vs services)
- Reduces per-product maintenance
- VendorProduct can override if needed

#### Option B: VAT on Product (More Granular)

```prisma
model Product {
  // ... existing
  vatClassification VatClassification?
  vatRatePercent    Float?
}
```

**Use when:** Products within same category have different rates (e.g., alcohol)

#### Recommended: Hybrid Approach

```prisma
// Category defines default
model ProductCategory {
  vatClassification VatClassification @default(REDUCED)
  vatRatePercent    Float @default(10.0)
}

// Product can override
model Product {
  vatClassification VatClassification?  // If null, use category
  vatRatePercent    Float?              // If null, use category
}

// VendorProduct can further override (rare)
model VendorProduct {
  vatOverridePercent Float?  // If null, use product/category
}
```

### 3.3 Order-Time Snapshots (CRITICAL for Auditing)

**Add to OrderItem:**

```prisma
model OrderItem {
  // ... existing

  // VAT Snapshot (captured at order creation)
  vatRatePercent    Float?    // The VAT rate applied (e.g., 10.0)
  vatClassification String?   // Snapshot: "REDUCED", "STANDARD", etc.
  vatAmountCents    Int?      // Computed: lineTotalCents * vatRate / (100 + vatRate)

  // Category snapshot
  categoryName      String?   // Snapshot of category at order time
}
```

**Add to SubOrder:**

```prisma
model SubOrder {
  // ... existing

  // VAT totals for this vendor's portion
  subTotalNetCents     Int?   // Before VAT
  subTotalVatCents     Int?   // VAT amount
  subTotalGrossCents   Int?   // After VAT (= subTotalCents today)
}
```

### 3.4 VAT Computation Logic

**Where to compute:**

1. **At cart add/update:** Display VAT breakdown in cart UI
2. **At order creation:** Snapshot VAT rate + compute amounts → store in OrderItem
3. **Never recompute historical orders:** Use stored snapshots only

**Sample computation (in code, not stored procedure):**

```typescript
function computeVatForOrderItem(
  lineTotalCents: number,
  vatRatePercent: number,
): { netCents: number; vatCents: number; grossCents: number } {
  // Italian VAT is VAT-inclusive pricing by default
  // Extract VAT from gross price: VAT = Gross × Rate / (100 + Rate)
  const grossCents = lineTotalCents;
  const vatCents = Math.round(
    (grossCents * vatRatePercent) / (100 + vatRatePercent),
  );
  const netCents = grossCents - vatCents;

  return { netCents, vatCents, grossCents };
}
```

### 3.5 Platform Fee Architecture (Option B: Monthly Invoicing)

**Current State:**

- `SubOrder.hydraFeeCents` and `hydraFeePercent` exist
- NOT deducted via `application_fee_amount` (explicitly noted in schema comments)
- Fees tracked but not collected at payment time

**Proposed Fee Tracking Fields (Already Partially Exist):**

```prisma
model SubOrder {
  // Existing
  hydraFeeCents       Int?      // Fee amount
  hydraFeePercent     Float?    // Fee rate (e.g., 0.05 for 5%)

  // Add for invoicing
  hydraFeeInvoicedAt  DateTime? // When included in monthly invoice
  hydraFeeInvoiceId   String?   // Reference to generated invoice
}
```

**Monthly Invoice Generation (Conceptual):**

```typescript
// Pseudocode for monthly fee invoice generation
async function generateMonthlyVendorInvoice(vendorId: string, month: Date) {
  // 1. Find all SubOrders with paymentStatus=SUCCEEDED, hydraFeeInvoicedAt=null
  const uninvoicedSubOrders = await prisma.subOrder.findMany({
    where: {
      vendorId,
      paymentStatus: "SUCCEEDED",
      hydraFeeInvoicedAt: null,
      paidAt: { gte: startOfMonth, lt: endOfMonth },
    },
  });

  // 2. Sum fees
  const totalFeeCents = uninvoicedSubOrders.reduce(
    (sum, so) => sum + (so.hydraFeeCents || 0),
    0,
  );

  // 3. Generate invoice (B2B service: VAT 22% on Hydra's fee)
  const hydraVatOnFee = Math.round((totalFeeCents * 22) / 100);

  // 4. Create invoice record (separate table) + mark SubOrders as invoiced
  // 5. Send invoice to vendor
}
```

### 3.6 Accounting Breakdown Example

**Scenario:** Client orders €100 of food (10% VAT) from Vendor A

```
CLIENT PAYS (to Vendor A via Hydra platform):
─────────────────────────────────────────────
Order Total (VAT-inclusive):      €100.00
  └─ Net amount:                   €90.91
  └─ VAT (10%):                     €9.09

VENDOR A RECEIVES (principal):
─────────────────────────────────────────────
Gross payment:                    €100.00
  └─ Vendor keeps net:             €90.91
  └─ Vendor remits VAT to state:    €9.09

HYDRA FEE (separate B2B invoice, end of month):
─────────────────────────────────────────────
Platform fee (5% of €100):          €5.00
VAT on service (22%):               €1.10
─────────────────────────────────────────────
Total vendor owes Hydra:            €6.10
```

**Key Points:**

1. Vendor is merchant of record for principal order
2. Vendor handles their own VAT on goods sold
3. Hydra invoices vendor separately for platform service
4. Hydra's fee is a B2B service → 22% IVA applies
5. These are completely separate accounting entries

---

## 4. Category Normalization Strategy

### 4.1 Proposed Canonical Taxonomy v1

```
FOOD (IVA 10% default, some items 4%)
├── Meat & Poultry
├── Seafood
├── Dairy & Eggs
├── Produce
├── Bakery & Bread
├── Frozen Foods
├── Dry Goods & Pantry
├── Condiments & Sauces
└── [NEW] Ice & Frozen Specialty (for Ghiaccio Puro)

BEVERAGE (IVA varies: 10% soft drinks, 22% alcohol)
├── Soft Drinks (IVA 10%)
├── Water (IVA 10%)
├── Juices (IVA 10%)
├── Coffee & Tea (IVA 10%)
└── Alcoholic Beverages (IVA 22%)
    ├── Wine
    ├── Beer
    └── Spirits

SERVICES (IVA 22%)
├── Cleaning & Disposables
├── Equipment & Supplies
└── Uniforms & Linens
```

### 4.2 Vendor Category Mapping Workflow

**Schema additions:**

```prisma
// Store vendor's original category strings
model VendorCategoryMapping {
  id                  String @id @default(cuid())
  vendorId            String
  vendorCategoryRaw   String  // Original string from vendor
  canonicalCategoryId String? // Mapped ProductCategory (null = unmapped)
  mappedAt            DateTime?
  mappedByUserId      String?
  autoMapped          Boolean @default(false)

  Vendor              Vendor @relation(fields: [vendorId], references: [id])
  ProductCategory     ProductCategory? @relation(fields: [canonicalCategoryId], references: [id])

  @@unique([vendorId, vendorCategoryRaw])
  @@index([canonicalCategoryId])
  @@index([vendorId])
}

// Track unmapped categories for admin review
model Product {
  // ... existing
  vendorCategoryRaw   String?  // Preserve original vendor category
}
```

**Workflow:**

1. **Ingest:** Store vendor's raw category string in `Product.vendorCategoryRaw`
2. **Auto-map:** Check `VendorCategoryMapping` for existing mapping
3. **Queue unmapped:** If no mapping exists, create entry with `canonicalCategoryId=null`
4. **Admin review:** UI shows unmapped categories → admin assigns canonical category
5. **Backfill:** When mapping created, update all products with that vendor+rawCategory

### 4.3 Unknown/Unmapped Category Handling

**Options:**

| Strategy                       | Behavior                                            | Risk                    |
| ------------------------------ | --------------------------------------------------- | ----------------------- |
| Block checkout                 | Products with unmapped categories cannot be ordered | High friction           |
| Default VAT class              | Use highest VAT rate (22%) as safe default          | Overcollection possible |
| **Flag + allow (Recommended)** | Allow ordering but flag for review                  | Operational overhead    |

**Recommended:** Flag + Allow with Admin Notifications

- Products without mapped canonical category get `needsCategoryReview=true`
- Default to FOOD category with 10% VAT (most common)
- Admin dashboard shows count of products needing review
- Daily/weekly report of unmapped categories

---

## 5. GitHub Issues for Phase 12

### Issue 12.0: Discovery/Spike Completion

```markdown
### Title: [Phase 12.0] Tax & Category Discovery Spike - COMPLETED

### Summary

Complete discovery spike for Phase 12: Italian VAT (IVA) + Platform Fee Accounting

### Deliverables

- [x] Audit current category/taxonomy schema
- [x] Document vendor import pipelines
- [x] Analyze order/SubOrder financial fields
- [x] Propose VAT schema additions
- [x] Propose fee tracking architecture
- [x] Document `docs/spike-taxonomy-vat.md`

### Done When

- [ ] Document reviewed by team
- [ ] Architecture decisions confirmed
- [ ] Phase 12.1/12.2/12.3 issues created with acceptance criteria

### Files Touched

- `docs/spike-taxonomy-vat.md` (created)
```

---

### Issue 12.1: Tax Foundation - Schema + Computation + Order Snapshots

```markdown
### Title: [Phase 12.1] VAT Foundation - Schema, Computation, and Order Snapshots

### Summary

Add foundational VAT support to Hydra's schema and order creation flow.

### Scope

- Add `VatClassification` enum to Prisma schema
- Add `vatRatePercent` and `vatClassification` to `ProductCategory`
- Add optional VAT override fields to `Product`
- Add VAT snapshot fields to `OrderItem` (`vatRatePercent`, `vatAmountCents`, `categoryName`)
- Add VAT totals to `SubOrder` (`subTotalNetCents`, `subTotalVatCents`)
- Update `createOrderFromCart()` to compute and snapshot VAT
- Seed Italian VAT rates for existing categories

### Out of Scope

- UI changes (Phase 12.2+)
- Vendor import changes (Phase 12.2)
- Fee collection (Phase 12.3)

### Acceptance Criteria

- [ ] Migration adds all VAT fields without data loss
- [ ] All existing categories have default VAT rate seeded
- [ ] `createOrderFromCart()` snapshots VAT rate for each item
- [ ] `SubOrder` totals computed correctly (net + VAT = gross)
- [ ] Unit tests for VAT computation logic
- [ ] Historical orders unaffected (VAT fields nullable)

### Dependencies

- Phase 12.0 (this spike) must be approved

### Files to Touch

- `prisma/schema.prisma`
- `prisma/migrations/[new]`
- `src/data/order.ts`
- `scripts/seed-vat-rates.ts` (new)
- `tests/orders/vat-computation.test.ts` (new)

### Estimate

~2-3 days implementation + testing
```

---

### Issue 12.2: Category Normalization + Vendor Import Mapping

```markdown
### Title: [Phase 12.2] Category Normalization + Vendor Import Mapping

### Summary

Implement canonical taxonomy and vendor category mapping workflow.

### Scope

- Create `VendorCategoryMapping` table
- Add `vendorCategoryRaw` to `Product`
- Add `needsCategoryReview` flag to `Product`
- Update vendor import scripts to:
  - Store raw vendor category
  - Check mapping table before assigning category
  - Queue unmapped categories for review
- Create admin UI for category mapping review
- Add VAT classification to category editor

### Out of Scope

- Automatic ML-based category classification
- Bulk import UI (CLI scripts are sufficient)

### Acceptance Criteria

- [ ] Vendor imports preserve original category string
- [ ] Existing mappings are reused across imports
- [ ] Admin can view/map unmapped vendor categories
- [ ] Mapped categories get VAT rate automatically
- [ ] Dashboard shows unmapped category count
- [ ] Products can be ordered even if category unmapped (with flag)

### Dependencies

- Phase 12.1 (VAT schema)

### Files to Touch

- `prisma/schema.prisma`
- `scripts/import-vendors.ts`
- `prisma/seed.ts`
- `src/app/dashboard/admin/categories/page.tsx` (new)
- `src/actions/admin-categories.ts` (new)
- `src/components/admin/category-mapping-table.tsx` (new)

### Estimate

~3-4 days implementation + testing
```

---

### Issue 12.3: Platform Fee Tracking + Monthly Invoicing (Option B)

```markdown
### Title: [Phase 12.3] Platform Fee Tracking + Monthly Vendor Invoicing

### Summary

Implement platform fee tracking per SubOrder and monthly vendor invoice generation.

### Scope

- Add invoice tracking fields to `SubOrder` (`hydraFeeInvoicedAt`, `hydraFeeInvoiceId`)
- Create `VendorInvoice` table for invoice records
- Implement fee calculation at order creation (populate `hydraFeeCents`)
- Create admin UI to view/export vendor fee summaries
- Create invoice generation script/job
- Generate PDF/CSV invoice for vendor

### Out of Scope

- Automatic invoice emailing (manual for now)
- `application_fee_amount` integration (future phase)
- Payment collection for invoices

### Acceptance Criteria

- [ ] Every SubOrder has `hydraFeeCents` computed at creation
- [ ] Admin can view fees by vendor/month
- [ ] Invoice generation marks SubOrders as invoiced
- [ ] Invoice includes fee amount + 22% IVA on service
- [ ] Generated invoice has correct accounting separation
- [ ] Cannot double-invoice same SubOrder

### Dependencies

- Phase 12.1 (VAT schema for computing fee VAT)

### Files to Touch

- `prisma/schema.prisma` (VendorInvoice model)
- `src/data/order.ts` (fee computation)
- `src/actions/admin-vendor-invoices.ts` (new)
- `src/app/dashboard/admin/invoices/page.tsx` (new)
- `scripts/generate-vendor-invoices.ts` (new)

### Estimate

~2-3 days implementation + testing
```

---

### Issue 12.4: Cart UI - VAT Breakdown Display

```markdown
### Title: [Phase 12.4] Cart UI - VAT Breakdown Display

### Summary

Update cart and checkout UI to show VAT breakdown.

### Scope

- Display net/VAT/gross breakdown in cart summary
- Show VAT rate per item (optional, collapsible)
- Update checkout page with VAT totals

### Out of Scope

- Invoice PDF generation for customers
- VAT receipt formatting

### Acceptance Criteria

- [ ] Cart shows "Subtotal (net)", "IVA", "Total"
- [ ] VAT amounts computed client-side match server
- [ ] Mobile-responsive layout

### Dependencies

- Phase 12.1

### Files to Touch

- `src/components/cart/cart-summary.tsx`
- `src/app/dashboard/checkout/checkout-page.tsx`

### Estimate

~1 day
```

---

## 6. Commands Run During Discovery

```bash
# Schema inspection
cat prisma/schema.prisma | grep -A 20 "model Product"
cat prisma/schema.prisma | grep -A 20 "model ProductCategory"
cat prisma/schema.prisma | grep -A 30 "model SubOrder"
cat prisma/schema.prisma | grep -A 15 "model OrderItem"

# Category/tax searches
grep -r "category" --include="*.ts" --include="*.tsx" | head -50
grep -r "vat\|iva\|tax\|aliquota" -i --include="*.ts" --include="*.tsx"
grep -r "hydraFee\|platformFee\|application_fee" -i --include="*.ts"

# Import pipeline
ls -la scripts/*.ts
cat scripts/seed-categories.ts
cat scripts/import-vendors.ts
cat prisma/seed.ts | head -300

# Vendor CSV samples
head -30 prisma/seed-data/vendors/cd_fish_products.csv
head -30 prisma/seed-data/vendors/general_beverage_products.csv

# Order creation flow
cat src/data/order.ts
cat src/lib/stripe-auth.ts | head -100
```

---

## 7. Risks and Mitigations

| Risk                               | Impact                    | Mitigation                        |
| ---------------------------------- | ------------------------- | --------------------------------- |
| VAT rate changes mid-order         | Incorrect historical data | Snapshot at order time (required) |
| Unmapped categories block business | Lost sales                | Default to common rate + flag     |
| Fee invoices disputed              | Revenue loss              | Clear audit trail, PDF receipts   |
| Retroactive VAT changes            | Legal/accounting issues   | Historical orders immutable       |
| Complex category hierarchy         | Maintenance overhead      | Keep taxonomy flat (2 levels max) |

---

## 8. Next Steps

1. **Team Review:** Review this document, validate assumptions
2. **Approve Architecture:** Confirm hybrid VAT approach (category default + product override)
3. **Create Issues:** Port GitHub issues from Section 5 to actual repo
4. **Prioritize:** Phase 12.1 → 12.2 → 12.3 (sequential dependencies)
5. **Begin Implementation:** Start with schema migration (12.1)

---

**Last Updated:** 2026-01-17
**Status:** Ready for Team Review
