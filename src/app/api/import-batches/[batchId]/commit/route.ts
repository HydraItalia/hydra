import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { commitModeSchema } from "@/lib/schemas/import";
import { commitBatch } from "@/lib/import/batch-service";

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
    const { searchParams } = new URL(req.url);
    const modeRaw = searchParams.get("mode") || "all";
    const modeParsed = commitModeSchema.safeParse(modeRaw);
    if (!modeParsed.success) {
      return NextResponse.json(
        { error: `Invalid mode "${modeRaw}". Must be "all" or "valid_only"` },
        { status: 400 },
      );
    }

    const result = await commitBatch(
      batchId,
      user.id,
      modeParsed.data,
      user.vendorId ?? null,
      user.role,
    );

    return NextResponse.json({
      id: batchId,
      status: "COMMITTED",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to commit import batch";
    if (message === "Batch not found")
      return NextResponse.json({ error: message }, { status: 404 });
    if (message === "Forbidden")
      return NextResponse.json({ error: message }, { status: 403 });
    if (
      message.includes("status must be") ||
      message.includes("Cannot commit with") ||
      message === "Batch is being processed by another request"
    )
      return NextResponse.json({ error: message }, { status: 409 });
    console.error("Import batch commit error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
