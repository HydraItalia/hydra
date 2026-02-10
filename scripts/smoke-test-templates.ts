/**
 * Smoke test for import mapping templates (Phase 3 PR A).
 *
 * Usage:
 *   pnpm tsx scripts/smoke-test-templates.ts
 *
 * What it does:
 *   1. Picks the first vendor from the DB
 *   2. Creates an import template with Italian column names
 *   3. Lists templates, verifies it shows up
 *   4. Tests suggestTemplateForCsv against matching + non-matching headers
 *   5. Creates a batch, parses CSV with the template, checks rows got mapped
 *   6. Cleans up (deletes batch, archives template)
 *
 * Requires: DATABASE_URL in .env
 */

import { prisma } from "../src/lib/prisma";
import {
  normalizeHeader,
  buildColumnMapping,
  applyColumnMapping,
  scoreTemplateMatch,
} from "../src/lib/import/catalog-csv/mapping";
import { extractCsvHeaders } from "../src/lib/import/catalog-csv/parser";
import type { TemplateMapping } from "../src/lib/import/catalog-csv/mapping";

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// ── Test Data ────────────────────────────────────────────────────────────────

const TEMPLATE_NAME = "__smoke_test_template__";

const italianMapping: TemplateMapping = {
  name: {
    sources: ["nome_prodotto", "product_name", "nome"],
    required: true,
  },
  category: {
    sources: ["categoria", "category"],
    required: true,
  },
  price_cents: {
    sources: ["prezzo", "price"],
    required: true,
    transform: "toCents",
  },
  unit: {
    sources: ["unita", "unit"],
    required: false,
    transform: "normalizeUnit",
  },
  in_stock: {
    sources: ["disponibile", "available", "in_stock"],
    required: false,
    transform: "toBool",
  },
  product_code: {
    sources: ["codice", "code", "product_code"],
    required: false,
  },
};

const italianCsv = `nome_prodotto,categoria,prezzo,unita,disponibile,codice
Vino Rosso,Beverage,12.50,bottle,si,WD-001
Salmone Fresco,Seafood,28.00,kg,true,CF-001
Pane Integrale,Bakery,3.50,piece,1,BK-001`;

const canonicalCsv = `name,category,price_cents,unit,in_stock,product_code
Red Wine,Beverage,1250,bottle,true,WD-001`;

// ── Pure function tests ──────────────────────────────────────────────────────

function testPureFunctions() {
  console.log("\n── Pure Mapping Functions ──");

  // normalizeHeader
  assert(normalizeHeader("Nome_Prodotto") === "nome prodotto", "normalizeHeader: underscore + case");
  assert(normalizeHeader("  PREZZO  ") === "prezzo", "normalizeHeader: trim + case");
  assert(normalizeHeader("product-name") === "product name", "normalizeHeader: dashes");

  // buildColumnMapping
  const headers = ["nome_prodotto", "categoria", "prezzo", "unita", "disponibile", "codice"];
  const { columnMap, resolvedFields, missingRequired } = buildColumnMapping(italianMapping, headers);
  assert(columnMap["nome_prodotto"] === "name", "buildColumnMapping: nome_prodotto → name");
  assert(columnMap["prezzo"] === "price_cents", "buildColumnMapping: prezzo → price_cents");
  assert(resolvedFields["name"] === "nome_prodotto", "resolvedFields: name → nome_prodotto");
  assert(missingRequired.length === 0, "buildColumnMapping: no missing required");

  // applyColumnMapping with transforms
  const rows = [
    { nome_prodotto: "Vino Rosso", categoria: "Beverage", prezzo: "12.50", unita: "kilogram", disponibile: "si", codice: "WD-001" },
  ];
  const mapped = applyColumnMapping(rows, columnMap, italianMapping);
  assert(mapped[0].name === "Vino Rosso", "applyColumnMapping: name mapped");
  assert(mapped[0].price_cents === "1250", "applyColumnMapping: toCents (12.50 → 1250)");
  assert(mapped[0].unit === "KG", "applyColumnMapping: normalizeUnit (kilogram → KG)");
  assert(mapped[0].in_stock === "true", "applyColumnMapping: toBool (si → true)");
  assert(mapped[0].nome_prodotto === "Vino Rosso", "applyColumnMapping: original column preserved");

  // scoreTemplateMatch
  const score = scoreTemplateMatch(italianMapping, headers);
  assert(score.score === 1.0, `scoreTemplateMatch: perfect score (got ${score.score})`);
  assert(score.missingRequired.length === 0, "scoreTemplateMatch: no missing required");

  // scoreTemplateMatch — partial
  const partialScore = scoreTemplateMatch(italianMapping, ["nome_prodotto", "categoria"]);
  assert(partialScore.score > 0 && partialScore.score < 1, `scoreTemplateMatch: partial score (got ${partialScore.score})`);
  assert(partialScore.missingRequired.includes("price_cents"), "scoreTemplateMatch: price_cents missing");

  // extractCsvHeaders
  const extractedHeaders = extractCsvHeaders(italianCsv);
  assert(extractedHeaders.length === 6, `extractCsvHeaders: got ${extractedHeaders.length} headers`);
  assert(extractedHeaders[0] === "nome_prodotto", "extractCsvHeaders: first header correct");

  // extractCsvHeaders — empty
  assert(extractCsvHeaders("").length === 0, "extractCsvHeaders: empty input → empty array");
}

// ── DB-dependent tests ───────────────────────────────────────────────────────

async function testWithDb() {
  console.log("\n── Database Tests ──");

  // Find a vendor to use
  const vendor = await prisma.vendor.findFirst({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  if (!vendor) {
    console.log("  ⚠ No vendors in DB — skipping DB tests");
    return;
  }
  console.log(`  Using vendor: ${vendor.name} (${vendor.id})`);

  // Find a user associated with this vendor (or any admin)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { vendorId: vendor.id },
        { role: "ADMIN" },
      ],
    },
    select: { id: true, role: true },
  });
  if (!user) {
    console.log("  ⚠ No user found for vendor — skipping DB tests");
    return;
  }
  console.log(`  Using user: ${user.id} (${user.role})`);

  let templateId: string | undefined;
  let batchId: string | undefined;

  try {
    // 1. Create template
    console.log("\n  ── Create Template ──");
    const template = await prisma.importTemplate.create({
      data: {
        vendorId: vendor.id,
        name: TEMPLATE_NAME,
        mapping: italianMapping as any,
        defaults: { vendor_name: vendor.name } as any,
      },
    });
    templateId = template.id;
    assert(!!template.id, `Template created: ${template.id}`);
    assert(template.status === "ACTIVE", "Template status is ACTIVE");

    // 2. List templates
    console.log("\n  ── List Templates ──");
    const templates = await prisma.importTemplate.findMany({
      where: { vendorId: vendor.id, status: "ACTIVE" },
    });
    const found = templates.find((t) => t.id === templateId);
    assert(!!found, "Template appears in list");

    // 3. Suggest template — matching headers
    console.log("\n  ── Suggest Template (matching) ──");
    const matchHeaders = extractCsvHeaders(italianCsv);
    const allTemplates = templates.map((t) => ({
      id: t.id,
      name: t.name,
      mapping: t.mapping as TemplateMapping,
    }));

    // Use the pure function directly (suggestTemplate)
    const { suggestTemplate } = await import("../src/lib/import/catalog-csv/mapping");
    const suggestion = suggestTemplate(allTemplates, matchHeaders);
    assert(suggestion !== null, "Got a suggestion");
    if (suggestion) {
      assert(suggestion.templateId === templateId, `Suggested our template (score: ${suggestion.score})`);
      assert(suggestion.score >= 0.75, `Auto-apply threshold met (score: ${suggestion.score})`);
      assert(suggestion.autoApply === true, "autoApply is true");
    }

    // 4. Suggest template — non-matching headers
    console.log("\n  ── Suggest Template (non-matching) ──");
    const noMatchHeaders = ["totally_unknown", "random_col", "foo"];
    const noSuggestion = suggestTemplate(allTemplates, noMatchHeaders);
    assert(noSuggestion === null, "No suggestion for unrelated headers");

    // 5. Create batch + parse with template
    console.log("\n  ── Parse Batch with Template ──");
    const batch = await prisma.importBatch.create({
      data: {
        vendorId: vendor.id,
        createdByUserId: user.id,
        status: "DRAFT",
        sourceType: "TEXT",
      },
    });
    batchId = batch.id;
    assert(!!batch.id, `Batch created: ${batch.id}`);

    // Import parseBatch from the service
    const { parseBatch } = await import("../src/lib/import/batch-service");
    const parseResult = await parseBatch(
      batch.id,
      italianCsv,
      user.id,
      user.role === "VENDOR" ? vendor.id : null,
      user.role,
      { templateId },
    );
    assert(parseResult.status === "PARSED", `Batch parsed (status: ${parseResult.status})`);
    assert(parseResult.rowCount === 3, `Row count: ${parseResult.rowCount}`);

    // Check that rows have mapped data
    const rows = await prisma.importBatchRow.findMany({
      where: { batchId: batch.id },
      orderBy: { rowIndex: "asc" },
    });
    assert(rows.length === 3, `3 rows in DB`);

    const firstRow = rows[0].normalizedData as any;
    assert(firstRow?.name === "Vino Rosso", `Row 0 name: "${firstRow?.name}"`);
    assert(firstRow?.priceCents === 1250, `Row 0 priceCents: ${firstRow?.priceCents} (expected 1250)`);
    assert(firstRow?.category === "Beverage", `Row 0 category: "${firstRow?.category}"`);

    const rawData = rows[0].rawData as any;
    assert(rawData?.nome_prodotto === "Vino Rosso", "Raw data preserves original column");

    // 6. Test that canonical CSV still works WITHOUT a template
    console.log("\n  ── Parse Batch without Template (regression) ──");
    const batch2 = await prisma.importBatch.create({
      data: {
        vendorId: vendor.id,
        createdByUserId: user.id,
        status: "DRAFT",
        sourceType: "TEXT",
      },
    });
    const regBatchId = batch2.id;

    const regResult = await parseBatch(
      batch2.id,
      canonicalCsv,
      user.id,
      user.role === "VENDOR" ? vendor.id : null,
      user.role,
    );
    assert(regResult.status === "PARSED", `Regression batch parsed`);
    assert(regResult.rowCount === 1, `Regression row count: ${regResult.rowCount}`);

    const regRows = await prisma.importBatchRow.findMany({ where: { batchId: regBatchId } });
    const regNorm = regRows[0].normalizedData as any;
    assert(regNorm?.name === "Red Wine", `Regression row name: "${regNorm?.name}"`);
    assert(regNorm?.priceCents === 1250, `Regression row priceCents: ${regNorm?.priceCents}`);

    // Clean up regression batch
    await prisma.importBatchRow.deleteMany({ where: { batchId: regBatchId } });
    await prisma.importBatch.delete({ where: { id: regBatchId } });

    // 7. Archive template
    console.log("\n  ── Archive Template ──");
    await prisma.importTemplate.update({
      where: { id: templateId },
      data: { status: "ARCHIVED" },
    });
    const archived = await prisma.importTemplate.findUnique({ where: { id: templateId } });
    assert(archived?.status === "ARCHIVED", "Template archived");

    // Verify archived template can't be used
    const batch3 = await prisma.importBatch.create({
      data: {
        vendorId: vendor.id,
        createdByUserId: user.id,
        status: "DRAFT",
        sourceType: "TEXT",
      },
    });
    try {
      await parseBatch(
        batch3.id,
        italianCsv,
        user.id,
        user.role === "VENDOR" ? vendor.id : null,
        user.role,
        { templateId },
      );
      assert(false, "Should have rejected archived template");
    } catch (err: any) {
      assert(err.message.includes("archived"), `Archived template rejected: "${err.message}"`);
    }
    // Clean up batch3
    await prisma.importBatchRow.deleteMany({ where: { batchId: batch3.id } });
    await prisma.importBatch.delete({ where: { id: batch3.id } });

  } finally {
    // Cleanup
    console.log("\n  ── Cleanup ──");
    if (batchId) {
      await prisma.importBatchRow.deleteMany({ where: { batchId } });
      await prisma.importBatch.delete({ where: { id: batchId } }).catch(() => {});
      console.log(`  Deleted batch ${batchId}`);
    }
    if (templateId) {
      await prisma.importTemplate.delete({ where: { id: templateId } }).catch(() => {});
      console.log(`  Deleted template ${templateId}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Import Template Smoke Test ===");

  testPureFunctions();
  await testWithDb();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((err) => {
    console.error("\nFatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
