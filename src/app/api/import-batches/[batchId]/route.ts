import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { batchDetailQuerySchema } from "@/lib/schemas/import";
import { getBatchDetail } from "@/lib/import/batch-service";

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
    const { searchParams } = new URL(req.url);
    const queryParsed = batchDetailQuerySchema.safeParse({
      page: searchParams.get("page") || "1",
    });
    const page = queryParsed.success ? queryParsed.data.page : 1;

    const detail = await getBatchDetail(
      batchId,
      page,
      user.vendorId ?? null,
      user.role,
    );

    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch import batch";
    if (message === "Batch not found")
      return NextResponse.json({ error: message }, { status: 404 });
    if (message === "Forbidden")
      return NextResponse.json({ error: message }, { status: 403 });
    console.error("Import batch detail error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
