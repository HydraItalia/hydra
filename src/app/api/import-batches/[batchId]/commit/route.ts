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
    const modeRaw = searchParams.get("mode") || "all";
    const modeParsed = commitModeSchema.safeParse(modeRaw);
    if (!modeParsed.success) {
      return NextResponse.json(
        { error: `Invalid mode "${modeRaw}". Must be "all" or "valid_only"` },
        { status: 400 },
      );
    }
    const mode = modeParsed.data;

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

      // Build a map of row DB records by index, filtering out rows with no normalized data
      const rowsWithData = validRows.filter(
        (r) => r.normalizedData !== null,
      );
      const normalizedRows = rowsWithData.map(
        (r) => r.normalizedData as unknown as NormalizedRow,
      );

      // Commit products + update row/batch status all inside one transaction
      const commitResults = await prisma.$transaction(
        async (tx) => {
          const results = await commitRows(
            tx as any,
            batch.vendorId,
            normalizedRows,
          );

          // Update each row record with product/vendorProduct IDs
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

          // Update batch to COMMITTED
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

      // Audit log is best-effort — don't let it fail the operation
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
