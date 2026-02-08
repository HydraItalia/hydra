import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { batchDetailQuerySchema } from "@/lib/schemas/import";

const ROWS_PER_PAGE = 100;

/** GET /api/import-batches/[batchId] — Batch detail with row summary */
export async function GET(
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

    // Authorization: VENDOR can only see their own, ADMIN can see all
    if (user.role === "VENDOR" && batch.vendorId !== user.vendorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse pagination
    const { searchParams } = new URL(req.url);
    const queryParsed = batchDetailQuerySchema.safeParse({
      page: searchParams.get("page") || "1",
    });
    const page = queryParsed.success ? queryParsed.data.page : 1;

    // Row status summary
    const statusCounts = await prisma.importBatchRow.groupBy({
      by: ["status"],
      where: { batchId },
      _count: true,
    });

    const summary: Record<string, number> = {
      pending: 0,
      valid: 0,
      error: 0,
      skipped: 0,
      committed: 0,
    };
    for (const sc of statusCounts) {
      summary[sc.status.toLowerCase()] = sc._count;
    }

    // Paginated rows
    const rows = await prisma.importBatchRow.findMany({
      where: { batchId },
      orderBy: { rowIndex: "asc" },
      skip: (page - 1) * ROWS_PER_PAGE,
      take: ROWS_PER_PAGE,
    });

    return NextResponse.json({
      id: batch.id,
      vendorId: batch.vendorId,
      status: batch.status,
      sourceType: batch.sourceType,
      originalFilename: batch.originalFilename,
      parseError: batch.parseError,
      rowCount: batch.rowCount,
      errorCount: batch.errorCount,
      committedAt: batch.committedAt,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      summary,
      rows,
      page,
      pageSize: ROWS_PER_PAGE,
    });
  } catch (error) {
    console.error("Import batch detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch import batch" },
      { status: 500 },
    );
  }
}
