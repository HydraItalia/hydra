import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { commitRows } from "@/lib/import/catalog-csv";
import { commitModeSchema } from "@/lib/schemas/import";
import type { NormalizedRow } from "@/lib/import/catalog-csv";

/** POST /api/import-batches/[batchId]/commit — Transactional commit */
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
    // Parse mode from query param
    const { searchParams } = new URL(req.url);
    const modeParsed = commitModeSchema.safeParse(
      searchParams.get("mode") || "all",
    );
    const mode = modeParsed.success ? modeParsed.data : "all";

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

    if (batch.status !== "VALIDATED") {
      return NextResponse.json(
        { error: `Batch status must be VALIDATED, got ${batch.status}` },
        { status: 409 },
      );
    }

    // mode=all rejects if there are errors
    if (mode === "all" && batch.errorCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot commit with ${batch.errorCount} error(s). Fix errors or use ?mode=valid_only`,
        },
        { status: 409 },
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
      // Fetch valid rows
      const validRows = await prisma.importBatchRow.findMany({
        where: { batchId, status: "VALID" },
        orderBy: { rowIndex: "asc" },
      });

      // If mode=valid_only, mark ERROR rows as SKIPPED
      if (mode === "valid_only") {
        await prisma.importBatchRow.updateMany({
          where: { batchId, status: "ERROR" },
          data: { status: "SKIPPED" },
        });
      }

      // Extract normalized data
      const normalizedRows = validRows
        .map((r) => r.normalizedData as NormalizedRow | null)
        .filter((r): r is NormalizedRow => r !== null);

      // Commit in a single transaction
      const commitResults = await prisma.$transaction(
        async (tx) => {
          return commitRows(tx as any, batch.vendorId, normalizedRows);
        },
        { timeout: 60_000 },
      );

      // Update row records with product/vendorProduct IDs
      for (let i = 0; i < commitResults.length; i++) {
        const result = commitResults[i];
        const row = validRows[i];
        await prisma.importBatchRow.update({
          where: { id: row.id },
          data: {
            status: "COMMITTED",
            productId: result.productId,
            vendorProductId: result.vendorProductId,
          },
        });
      }

      // Update batch to COMMITTED
      await prisma.importBatch.update({
        where: { id: batchId },
        data: {
          status: "COMMITTED",
          committedAt: new Date(),
          lockedAt: null,
          lockedByUserId: null,
        },
      });

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

      return NextResponse.json({
        id: batchId,
        status: "COMMITTED",
        committedRows: commitResults.length,
        newProducts: commitResults.filter((r) => r.created).length,
        updatedProducts: commitResults.filter((r) => !r.created).length,
      });
    } catch (err) {
      // Reset batch on failure
      await prisma.importBatch.update({
        where: { id: batchId },
        data: {
          status: "FAILED",
          parseError: `Commit failed: ${err instanceof Error ? err.message : String(err)}`,
          lockedAt: null,
          lockedByUserId: null,
        },
      });

      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_FAILED,
        diff: {
          phase: "commit",
          error: err instanceof Error ? err.message : String(err),
        },
      });

      return NextResponse.json({ error: "Commit failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Import batch commit error:", error);
    return NextResponse.json(
      { error: "Failed to commit import batch" },
      { status: 500 },
    );
  }
}
