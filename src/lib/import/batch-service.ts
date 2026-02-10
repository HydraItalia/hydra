/**
 * Shared service layer for import batch operations.
 * Called by both API routes and server actions.
 * All mutating functions include ownership checks.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { logAction, AuditAction } from "@/lib/audit";
import {
  parseCsv,
  CsvParseError,
  normalizeRow,
  validateRow,
  loadExistingCategories,
  commitRows,
  canonicalizeName,
  buildColumnMapping,
  applyColumnMapping,
} from "@/lib/import/catalog-csv";
import type {
  NormalizedRow,
  TemplateMapping,
  TransactionClient,
} from "@/lib/import/catalog-csv";
import { resolveCategory, getAllCanonicalCategories } from "@/lib/taxonomy";

const ROWS_PER_PAGE = 100;
const MAX_ERROR_EXPORT_ROWS = 5_000;

// ----- Types -----

export type BatchSummary = {
  pending: number;
  valid: number;
  error: number;
  skipped: number;
  committed: number;
};

export type BatchDetail = {
  id: string;
  vendorId: string;
  status: string;
  sourceType: string;
  originalFilename: string | null;
  parseError: string | null;
  rowCount: number;
  errorCount: number;
  committedAt: string | null;
  createdAt: string;
  updatedAt: string;
  summary: BatchSummary;
  rows: BatchRow[];
  page: number;
  pageSize: number;
  totalRows: number;
};

export type BatchRow = {
  id: string;
  rowIndex: number;
  rawData: unknown;
  normalizedData: unknown;
  errors: unknown;
  status: string;
  productId: string | null;
  vendorProductId: string | null;
};

export type BatchListItem = {
  id: string;
  vendorId: string;
  vendorName: string;
  status: string;
  originalFilename: string | null;
  rowCount: number;
  errorCount: number;
  committedAt: string | null;
  createdAt: string;
};

// ----- Ownership check helper -----

async function verifyBatchOwnership(
  batchId: string,
  vendorId: string | null,
  role: string,
) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });
  if (!batch) throw new Error("Batch not found");
  if (role === "VENDOR") {
    if (!vendorId || batch.vendorId !== vendorId) throw new Error("Forbidden");
  } else if (role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return batch;
}

// ----- Vendor category mapping helpers -----

/**
 * Load all vendor category mappings as a Map<rawCategory, canonicalSlug>.
 */
async function loadVendorMappings(
  vendorId: string,
): Promise<Map<string, string>> {
  const mappings = await prisma.vendorCategoryMapping.findMany({
    where: { vendorId },
  });
  const map = new Map<string, string>();
  for (const m of mappings) {
    map.set(m.rawCategory, m.canonicalSlug);
  }
  return map;
}

/**
 * Apply a vendor mapping to a NormalizedRow if it has didFallback: true.
 * Mutates the row in-place if a mapping exists.
 */
function applyVendorMapping(
  row: NormalizedRow,
  mappings: Map<string, string>,
): void {
  if (!row.didFallback) return;

  const key = row.category.trim().toLowerCase();
  const canonicalSlug = mappings.get(key);
  if (!canonicalSlug) return;

  // Re-resolve through taxonomy to confirm the mapped slug is canonical
  const resolved = resolveCategory(canonicalSlug, "IT");
  if (resolved.didFallback) return; // mapped slug isn't canonical — leave didFallback true
  row.categorySlug = resolved.canonicalSlug;
  row.categoryGroup = resolved.group;
  row.didFallback = false;
}

/**
 * Ensure all canonical categories from the taxonomy registry exist in the DB.
 * Called inside the commit transaction before commitRows.
 */
async function ensureCanonicalCategories(tx: TransactionClient): Promise<void> {
  const categories = getAllCanonicalCategories("IT");

  // Collect unique groups
  const groups = new Set(categories.map((c) => c.group));

  // Upsert category groups
  for (const groupName of groups) {
    await tx.categoryGroup.upsert({
      where: { name: groupName },
      update: {},
      create: { id: createId(), name: groupName },
    });
  }

  // Now upsert each canonical category
  for (const cat of categories) {
    const group = await tx.categoryGroup.findUnique({
      where: { name: cat.group },
    });
    if (!group) continue;

    await tx.productCategory.upsert({
      where: { slug: cat.slug },
      update: { groupId: group.id },
      create: {
        id: createId(),
        name: cat.name,
        slug: cat.slug,
        groupId: group.id,
      },
    });
  }
}

// ----- Service functions -----

export async function createBatch(
  vendorId: string,
  createdByUserId: string,
  filename?: string,
) {
  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const batch = await prisma.importBatch.create({
    data: {
      vendorId,
      createdByUserId,
      status: "DRAFT",
      sourceType: "TEXT",
      originalFilename: filename || null,
    },
  });

  try {
    await logAction({
      entityType: "ImportBatch",
      entityId: batch.id,
      action: AuditAction.IMPORT_BATCH_CREATED,
      diff: { vendorId, filename },
    });
  } catch {
    // Audit failure is non-fatal
  }

  return { id: batch.id, vendorId: batch.vendorId, status: batch.status };
}

export type ParseBatchOpts = {
  templateId?: string;
  mappingOverride?: TemplateMapping;
};

export async function parseBatch(
  batchId: string,
  csvText: string,
  userId: string,
  vendorId: string | null,
  role: string,
  opts?: ParseBatchOpts,
) {
  const batch = await verifyBatchOwnership(batchId, vendorId, role);

  if (batch.status !== "DRAFT") {
    throw new Error(`Batch status must be DRAFT, got ${batch.status}`);
  }

  // Optimistic lock: set PARSING
  const lockResult = await prisma.importBatch.updateMany({
    where: { id: batchId, status: "DRAFT" },
    data: {
      status: "PARSING",
      lockedAt: new Date(),
      lockedByUserId: userId,
    },
  });

  if (lockResult.count === 0) {
    throw new Error("Batch is being processed by another request");
  }

  try {
    // Resolve template mapping
    let templateMapping: TemplateMapping | undefined;
    let templateDefaults: Record<string, string> | undefined;

    if (opts?.mappingOverride) {
      templateMapping = opts.mappingOverride;
    } else if (opts?.templateId) {
      const template = await prisma.importTemplate.findUnique({
        where: { id: opts.templateId },
      });
      if (!template) throw new Error("Template not found");
      if (template.status !== "ACTIVE") {
        throw new Error("Template is archived");
      }
      if (template.vendorId !== batch.vendorId) {
        throw new Error("Template does not belong to this vendor");
      }
      templateMapping = template.mapping as TemplateMapping;
      templateDefaults =
        (template.defaults as Record<string, string>) ?? undefined;
    }

    // Parse CSV — keep all columns when mapping is present
    const rawRows = parseCsv(
      csvText,
      templateMapping ? { keepAllColumns: true } : undefined,
    );

    // Apply column mapping if present
    let mappedRows: Record<string, string>[];
    if (templateMapping) {
      const csvHeaders = Object.keys(rawRows[0] || {});
      const { columnMap } = buildColumnMapping(templateMapping, csvHeaders);
      mappedRows = applyColumnMapping(
        rawRows as unknown as Record<string, string>[],
        columnMap,
        templateMapping,
        templateDefaults,
      );
    } else {
      mappedRows = rawRows as unknown as Record<string, string>[];
    }

    // Auto-fill vendor name from the batch's vendor so CSV doesn't need it
    const vendor = await prisma.vendor.findUnique({
      where: { id: batch.vendorId },
      select: { name: true },
    });
    const vendorName = vendor?.name || "";

    // Load vendor category mappings for fallback resolution
    const vendorMappings = await loadVendorMappings(batch.vendorId);

    const rowData = mappedRows.map((raw, index) => {
      const normalized = normalizeRow(raw as any);
      // If the CSV row doesn't have vendor_name, fill from the batch's vendor
      if (!normalized.vendorName && vendorName) {
        normalized.vendorName = vendorName;
      }
      // Apply vendor category mapping if the category fell back
      applyVendorMapping(normalized, vendorMappings);
      return {
        batchId,
        rowIndex: index,
        rawData: raw as any,
        normalizedData: normalized as any,
        status: "PENDING" as const,
      };
    });

    // Delete any existing rows (in case of re-parse) and create new ones
    await prisma.importBatchRow.deleteMany({ where: { batchId } });
    await prisma.importBatchRow.createMany({ data: rowData });

    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: "PARSED",
        rowCount: rawRows.length,
        errorCount: 0,
        parseError: null,
        lockedAt: null,
        lockedByUserId: null,
      },
    });

    return { id: batchId, status: "PARSED" as const, rowCount: rawRows.length };
  } catch (err) {
    const errorMessage =
      err instanceof CsvParseError
        ? err.message
        : `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;

    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: "FAILED",
        parseError: errorMessage,
        lockedAt: null,
        lockedByUserId: null,
      },
    });

    try {
      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_FAILED,
        diff: { phase: "parse", error: errorMessage },
      });
    } catch {
      // Audit failure is non-fatal
    }

    throw new Error(errorMessage);
  }
}

export async function getBatchDetail(
  batchId: string,
  page: number = 1,
  vendorId: string | null = null,
  role: string = "ADMIN",
): Promise<BatchDetail> {
  const batch = await verifyBatchOwnership(batchId, vendorId, role);

  // Row status summary
  const statusCounts = await prisma.importBatchRow.groupBy({
    by: ["status"],
    where: { batchId },
    _count: true,
  });

  const summary: BatchSummary = {
    pending: 0,
    valid: 0,
    error: 0,
    skipped: 0,
    committed: 0,
  };
  for (const sc of statusCounts) {
    summary[sc.status.toLowerCase() as keyof BatchSummary] = sc._count;
  }

  const totalRows = Object.values(summary).reduce((a, b) => a + b, 0);

  // Paginated rows
  const rows = await prisma.importBatchRow.findMany({
    where: { batchId },
    orderBy: { rowIndex: "asc" },
    skip: (page - 1) * ROWS_PER_PAGE,
    take: ROWS_PER_PAGE,
  });

  return {
    id: batch.id,
    vendorId: batch.vendorId,
    status: batch.status,
    sourceType: batch.sourceType,
    originalFilename: batch.originalFilename,
    parseError: batch.parseError,
    rowCount: batch.rowCount,
    errorCount: batch.errorCount,
    committedAt: batch.committedAt?.toISOString() ?? null,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    summary,
    rows: rows.map((r) => ({
      id: r.id,
      rowIndex: r.rowIndex,
      rawData: r.rawData,
      normalizedData: r.normalizedData,
      errors: r.errors,
      status: r.status,
      productId: r.productId,
      vendorProductId: r.vendorProductId,
    })),
    page,
    pageSize: ROWS_PER_PAGE,
    totalRows,
  };
}

export async function getBatchRows(
  batchId: string,
  opts: {
    page?: number;
    statusFilter?: string;
    vendorId?: string | null;
    role?: string;
  } = {},
) {
  const { page = 1, statusFilter, vendorId = null, role = "ADMIN" } = opts;
  await verifyBatchOwnership(batchId, vendorId, role);

  const where: any = { batchId };
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [rows, total] = await Promise.all([
    prisma.importBatchRow.findMany({
      where,
      orderBy: { rowIndex: "asc" },
      skip: (page - 1) * ROWS_PER_PAGE,
      take: ROWS_PER_PAGE,
    }),
    prisma.importBatchRow.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      rowIndex: r.rowIndex,
      rawData: r.rawData,
      normalizedData: r.normalizedData,
      errors: r.errors,
      status: r.status,
      productId: r.productId,
      vendorProductId: r.vendorProductId,
    })),
    total,
    page,
    pageSize: ROWS_PER_PAGE,
    totalPages: Math.ceil(total / ROWS_PER_PAGE),
  };
}

export async function validateBatch(
  batchId: string,
  userId: string,
  vendorId: string | null,
  role: string,
) {
  const batch = await verifyBatchOwnership(batchId, vendorId, role);

  if (batch.status !== "PARSED" && batch.status !== "VALIDATED") {
    throw new Error(
      `Batch status must be PARSED or VALIDATED, got ${batch.status}`,
    );
  }

  // Optimistic lock
  const lockResult = await prisma.importBatch.updateMany({
    where: {
      id: batchId,
      status: { in: ["PARSED", "VALIDATED"] },
      lockedAt: null,
    },
    data: {
      status: "VALIDATING",
      lockedAt: new Date(),
      lockedByUserId: userId,
    },
  });

  if (lockResult.count === 0) {
    throw new Error("Batch is being processed by another request");
  }

  try {
    const existingCategories = await loadExistingCategories(prisma);

    const rows = await prisma.importBatchRow.findMany({
      where: { batchId },
      orderBy: { rowIndex: "asc" },
    });

    let errorCount = 0;
    const validIds: string[] = [];
    const errorUpdates: { id: string; errors: string[] }[] = [];

    for (const row of rows) {
      const normalizedData = row.normalizedData as NormalizedRow | null;
      if (!normalizedData) {
        errorUpdates.push({
          id: row.id,
          errors: ["Row has no normalized data"],
        });
        errorCount++;
        continue;
      }

      const result = validateRow(
        row.rowIndex,
        normalizedData,
        existingCategories,
      );

      if (result.valid) {
        validIds.push(row.id);
      } else {
        errorUpdates.push({ id: row.id, errors: result.errors });
        errorCount++;
      }
    }

    if (validIds.length > 0) {
      await prisma.importBatchRow.updateMany({
        where: { id: { in: validIds } },
        data: { status: "VALID", errors: Prisma.JsonNull },
      });
    }

    for (const { id, errors } of errorUpdates) {
      await prisma.importBatchRow.update({
        where: { id },
        data: { status: "ERROR", errors },
      });
    }

    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: "VALIDATED",
        errorCount,
        lockedAt: null,
        lockedByUserId: null,
      },
    });

    try {
      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_VALIDATED,
        diff: { rowCount: rows.length, errorCount },
      });
    } catch {
      // Audit failure is non-fatal
    }

    return { rowCount: rows.length, errorCount };
  } catch (err) {
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: "FAILED",
        parseError: `Validation failed: ${err instanceof Error ? err.message : String(err)}`,
        lockedAt: null,
        lockedByUserId: null,
      },
    });

    try {
      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_FAILED,
        diff: {
          phase: "validate",
          error: err instanceof Error ? err.message : String(err),
        },
      });
    } catch {
      // Audit failure is non-fatal
    }

    throw new Error("Validation failed");
  }
}

export async function commitBatch(
  batchId: string,
  userId: string,
  mode: "all" | "valid_only",
  vendorId: string | null,
  role: string,
) {
  const batch = await verifyBatchOwnership(batchId, vendorId, role);

  if (batch.status !== "VALIDATED") {
    throw new Error(`Batch status must be VALIDATED, got ${batch.status}`);
  }

  if (mode === "all" && batch.errorCount > 0) {
    throw new Error(
      `Cannot commit with ${batch.errorCount} error(s). Fix errors or use valid_only mode`,
    );
  }

  // Optimistic lock
  const lockResult = await prisma.importBatch.updateMany({
    where: {
      id: batchId,
      status: "VALIDATED",
      lockedAt: null,
    },
    data: {
      status: "COMMITTING",
      lockedAt: new Date(),
      lockedByUserId: userId,
    },
  });

  if (lockResult.count === 0) {
    throw new Error("Batch is being processed by another request");
  }

  try {
    const validRows = await prisma.importBatchRow.findMany({
      where: { batchId, status: "VALID" },
      orderBy: { rowIndex: "asc" },
    });

    if (mode === "valid_only") {
      await prisma.importBatchRow.updateMany({
        where: { batchId, status: "ERROR" },
        data: { status: "SKIPPED" },
      });
    }

    const rowsWithData = validRows.filter((r) => r.normalizedData !== null);
    const normalizedRows = rowsWithData.map(
      (r) => r.normalizedData as unknown as NormalizedRow,
    );

    const commitResults = await prisma.$transaction(
      async (tx) => {
        // Ensure all canonical categories exist before committing rows
        await ensureCanonicalCategories(tx as unknown as TransactionClient);

        const results = await commitRows(
          tx as any,
          batch.vendorId,
          normalizedRows,
        );

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const row = rowsWithData[i];
          await tx.importBatchRow.update({
            where: { id: row.id },
            data: {
              status: "COMMITTED",
              productId: result.productId,
              vendorProductId: result.vendorProductId,
            },
          });
        }

        await tx.importBatch.update({
          where: { id: batchId },
          data: {
            status: "COMMITTED",
            committedAt: new Date(),
            lockedAt: null,
            lockedByUserId: null,
          },
        });

        return results;
      },
      { timeout: 60_000 },
    );

    try {
      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_COMMITTED,
        diff: {
          mode,
          committedRows: commitResults.length,
          newProducts: commitResults.filter((r) => r.created).length,
          updatedProducts: commitResults.filter((r) => !r.created).length,
        },
      });
    } catch {
      // Audit failure is non-fatal
    }

    return {
      committedRows: commitResults.length,
      newProducts: commitResults.filter((r) => r.created).length,
      updatedProducts: commitResults.filter((r) => !r.created).length,
    };
  } catch (err) {
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: "FAILED",
        parseError: `Commit failed: ${err instanceof Error ? err.message : String(err)}`,
        lockedAt: null,
        lockedByUserId: null,
      },
    });

    try {
      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_FAILED,
        diff: {
          phase: "commit",
          error: err instanceof Error ? err.message : String(err),
        },
      });
    } catch {
      // Audit failure is non-fatal
    }

    throw new Error("Commit failed");
  }
}

export async function updateAndRevalidateRow(
  batchId: string,
  rowId: string,
  updates: Partial<
    Pick<
      NormalizedRow,
      "name" | "category" | "unit" | "priceCents" | "inStock" | "productCode"
    >
  >,
  vendorId: string | null,
  role: string,
) {
  const batch = await verifyBatchOwnership(batchId, vendorId, role);

  if (batch.status !== "VALIDATED") {
    throw new Error(`Batch status must be VALIDATED, got ${batch.status}`);
  }

  const row = await prisma.importBatchRow.findUnique({
    where: { id: rowId },
  });
  if (!row || row.batchId !== batchId) {
    throw new Error("Row not found");
  }

  // Merge updates into existing normalizedData
  const existing =
    (row.normalizedData as unknown as NormalizedRow) || ({} as NormalizedRow);
  const merged: NormalizedRow = { ...existing, ...updates };

  // Recompute derived fields using taxonomy resolver
  merged.canonicalName = canonicalizeName(merged.name);
  const resolved = resolveCategory(merged.category, "IT");
  merged.categorySlug = resolved.canonicalSlug;
  merged.categoryGroup = resolved.group;
  merged.didFallback = resolved.didFallback;

  // If still a fallback, check vendor mappings
  if (merged.didFallback) {
    const vendorMappings = await loadVendorMappings(batch.vendorId);
    applyVendorMapping(merged, vendorMappings);
  }

  // Re-validate
  const existingCategories = await loadExistingCategories(prisma);
  const result = validateRow(row.rowIndex, merged, existingCategories);

  const newStatus = result.valid ? "VALID" : "ERROR";
  const newErrors = result.valid ? Prisma.JsonNull : result.errors;

  await prisma.importBatchRow.update({
    where: { id: rowId },
    data: {
      normalizedData: merged as any,
      status: newStatus,
      errors: newErrors,
    },
  });

  // Recalculate batch errorCount
  const errorCount = await prisma.importBatchRow.count({
    where: { batchId, status: "ERROR" },
  });

  await prisma.importBatch.update({
    where: { id: batchId },
    data: { errorCount },
  });

  return {
    status: newStatus,
    errors: result.errors,
    normalizedData: merged,
    batchErrorCount: errorCount,
  };
}

export async function getErrorRowsCsv(
  batchId: string,
  vendorId: string | null,
  role: string,
): Promise<string> {
  await verifyBatchOwnership(batchId, vendorId, role);

  const totalErrors = await prisma.importBatchRow.count({
    where: { batchId, status: "ERROR" },
  });

  if (totalErrors > MAX_ERROR_EXPORT_ROWS) {
    throw new Error(
      `Too many error rows (${totalErrors}). Maximum export is ${MAX_ERROR_EXPORT_ROWS} rows. Please fix errors in smaller batches.`,
    );
  }

  const errorRows = await prisma.importBatchRow.findMany({
    where: { batchId, status: "ERROR" },
    orderBy: { rowIndex: "asc" },
    take: MAX_ERROR_EXPORT_ROWS,
  });

  if (errorRows.length === 0) return "";

  // Build CSV with error column appended
  const headers = [
    "row_number",
    "name",
    "category",
    "unit",
    "price_cents",
    "in_stock",
    "product_code",
    "errors",
  ];

  const csvLines = [headers.join(",")];

  for (const row of errorRows) {
    const raw = (row.rawData || {}) as Record<string, string>;
    const errors = Array.isArray(row.errors)
      ? (row.errors as string[]).join("; ")
      : String(row.errors || "");

    const values = [
      String(row.rowIndex + 1),
      escapeCsvField(raw.name || ""),
      escapeCsvField(raw.category || ""),
      escapeCsvField(raw.unit || ""),
      escapeCsvField(raw.price_cents || ""),
      escapeCsvField(raw.in_stock || ""),
      escapeCsvField(raw.product_code || ""),
      escapeCsvField(errors),
    ];

    csvLines.push(values.join(","));
  }

  return csvLines.join("\n");
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Delete a batch and all its rows. Only non-COMMITTED batches can be deleted.
 * Also rejects deletion of batches currently being processed (locked).
 */
export async function deleteBatch(
  batchId: string,
  vendorId: string | null,
  role: string,
) {
  const batch = await verifyBatchOwnership(batchId, vendorId, role);

  if (batch.status === "COMMITTED") {
    throw new Error("Cannot delete a committed batch");
  }

  if (batch.lockedAt) {
    throw new Error("Batch is currently being processed");
  }

  // Rows cascade-delete via the schema's onDelete: Cascade
  await prisma.importBatch.delete({ where: { id: batchId } });
}

/**
 * List batches — VENDOR sees own, ADMIN sees all with optional filters.
 */
export async function listBatches(opts: {
  vendorId?: string | null;
  role: string;
  page?: number;
  pageSize?: number;
  statusFilter?: string;
}) {
  const { vendorId, role, page = 1, pageSize = 20, statusFilter } = opts;

  if (role !== "ADMIN" && role !== "VENDOR") {
    throw new Error("Forbidden");
  }

  const where: any = {};
  if (role === "VENDOR") {
    if (!vendorId) throw new Error("Vendor user has no associated vendor");
    where.vendorId = vendorId;
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [batches, total] = await Promise.all([
    prisma.importBatch.findMany({
      where,
      include: {
        Vendor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.importBatch.count({ where }),
  ]);

  return {
    data: batches.map((b) => ({
      id: b.id,
      vendorId: b.vendorId,
      vendorName: b.Vendor.name,
      status: b.status,
      originalFilename: b.originalFilename,
      rowCount: b.rowCount,
      errorCount: b.errorCount,
      committedAt: b.committedAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
    total,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
    pageSize,
  };
}
