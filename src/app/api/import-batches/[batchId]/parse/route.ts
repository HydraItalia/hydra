import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { parseImportBatchSchema } from "@/lib/schemas/import";
import {
  parseCsv,
  CsvParseError,
  normalizeRow,
} from "@/lib/import/catalog-csv";

/** POST /api/import-batches/[batchId]/parse — Parse CSV text and stage rows */
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
    const body = await req.json();
    const parsed = parseImportBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Fetch batch and check status
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

    if (batch.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Batch status must be DRAFT, got ${batch.status}` },
        { status: 409 },
      );
    }

    // Optimistic lock: set PARSING
    const lockResult = await prisma.importBatch.updateMany({
      where: { id: batchId, status: "DRAFT" },
      data: {
        status: "PARSING",
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
      // Parse CSV
      const rawRows = parseCsv(parsed.data.csvText);

      // Normalize and create staged rows
      const rowData = rawRows.map((raw, index) => {
        const normalized = normalizeRow(raw);
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

      // Update batch to PARSED
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

      return NextResponse.json({
        id: batchId,
        status: "PARSED",
        rowCount: rawRows.length,
      });
    } catch (err) {
      // Parse failed — set FAILED status
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

      await logAction({
        entityType: "ImportBatch",
        entityId: batchId,
        action: AuditAction.IMPORT_BATCH_FAILED,
        diff: { phase: "parse", error: errorMessage },
      });

      return NextResponse.json({ error: errorMessage }, { status: 422 });
    }
  } catch (error) {
    console.error("Import batch parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse import batch" },
      { status: 500 },
    );
  }
}
