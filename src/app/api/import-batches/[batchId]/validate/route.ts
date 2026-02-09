import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { validateBatch } from "@/lib/import/batch-service";

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
    const result = await validateBatch(
      batchId,
      user.id,
      user.vendorId ?? null,
      user.role,
    );

    return NextResponse.json({
      id: batchId,
      status: "VALIDATED",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to validate import batch";
    if (message === "Batch not found")
      return NextResponse.json({ error: message }, { status: 404 });
    if (message === "Forbidden")
      return NextResponse.json({ error: message }, { status: 403 });
    if (message.includes("status must be"))
      return NextResponse.json({ error: message }, { status: 409 });
    if (message === "Batch is being processed by another request")
      return NextResponse.json({ error: message }, { status: 409 });
    console.error("Import batch validate error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
