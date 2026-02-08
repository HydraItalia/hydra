import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { validateRow, loadExistingCategories } from "@/lib/import/catalog-csv";
import type { NormalizedRow } from "@/lib/import/catalog-csv";

/** POST /api/import-batches/[batchId]/validate — Validate all staged rows */
export async function POST(
  req: NextRequest,
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

      // Validate each row and update status
      for (const row of rows) {
        const normalizedData = row.normalizedData as NormalizedRow | null;
        if (!normalizedData) {
          await prisma.importBatchRow.update({
            where: { id: row.id },
            data: {
              status: "ERROR",
              errors: ["Row has no normalized data"],
            },
          });
          errorCount++;
          continue;
        }

        const result = validateRow(
          row.rowIndex,
          normalizedData,
          existingCategories,
        );

        await prisma.importBatchRow.update({
          where: { id: row.id },
          data: {
            status: result.valid ? "VALID" : "ERROR",
            errors: result.errors.length > 0 ? result.errors : null,
          },
        });

        if (!result.valid) errorCount++;
      }

      // Update batch
      await prisma.importBatch.update({
        where: { id: batchId },
        data: {
          status: "VALIDATED",
          errorCount,
          lockedAt: null,
          lockedByUserId: null,
        },
      });

      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_VALIDATED,
        diff: { rowCount: rows.length, errorCount },
      });

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

      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_FAILED,
        diff: {
          phase: "validate",
          error: err instanceof Error ? err.message : String(err),
        },
      });

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
