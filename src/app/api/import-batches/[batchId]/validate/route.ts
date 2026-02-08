import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logAction, AuditAction } from "@/lib/audit";
import { validateRow, loadExistingCategories } from "@/lib/import/catalog-csv";
import type { NormalizedRow } from "@/lib/import/catalog-csv";

/** POST /api/import-batches/[batchId]/validate — Validate all staged rows */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { batchId } = await params;

  try {
    const batch = await prisma.importBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Authorization
    if (user.role === "VENDOR" && batch.vendorId !== user.vendorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (batch.status !== "PARSED" && batch.status !== "VALIDATED") {
      return NextResponse.json(
        {
          error: `Batch status must be PARSED or VALIDATED, got ${batch.status}`,
        },
        { status: 409 },
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
        lockedByUserId: user.id,
      },
    });

    if (lockResult.count === 0) {
      return NextResponse.json(
        { error: "Batch is being processed by another request" },
        { status: 409 },
      );
    }

    try {
      // Pre-fetch existing categories
      const existingCategories = await loadExistingCategories(prisma);

      // Fetch all rows
      const rows = await prisma.importBatchRow.findMany({
        where: { batchId },
        orderBy: { rowIndex: "asc" },
      });

      let errorCount = 0;

      // Validate each row and collect updates
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

      // Batch update: mark all valid rows at once
      if (validIds.length > 0) {
        await prisma.importBatchRow.updateMany({
          where: { id: { in: validIds } },
          data: { status: "VALID", errors: Prisma.JsonNull },
        });
      }

      // Update error rows individually (each has unique error messages)
      for (const { id, errors } of errorUpdates) {
        await prisma.importBatchRow.update({
          where: { id },
          data: { status: "ERROR", errors },
        });
      }

      // Update batch status
      await prisma.importBatch.update({
        where: { id: batchId },
        data: {
          status: "VALIDATED",
          errorCount,
          lockedAt: null,
          lockedByUserId: null,
        },
      });

      // Audit log is best-effort — don't let it fail the operation
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

      return NextResponse.json({
        id: batchId,
        status: "VALIDATED",
        rowCount: rows.length,
        errorCount,
      });
    } catch (err) {
      // Reset batch on failure
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

      return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Import batch validate error:", error);
    return NextResponse.json(
      { error: "Failed to validate import batch" },
      { status: 500 },
    );
  }
}
