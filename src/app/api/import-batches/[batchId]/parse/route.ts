import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { parseImportBatchSchema } from "@/lib/schemas/import";
import { parseBatch } from "@/lib/import/batch-service";

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

    const result = await parseBatch(
      batchId,
      parsed.data.csvText,
      user.id,
      user.vendorId ?? null,
      user.role,
    );

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse import batch";
    if (message === "Batch not found")
      return NextResponse.json({ error: message }, { status: 404 });
    if (message === "Forbidden")
      return NextResponse.json({ error: message }, { status: 403 });
    if (message.includes("status must be"))
      return NextResponse.json({ error: message }, { status: 409 });
    if (message === "Batch is being processed by another request")
      return NextResponse.json({ error: message }, { status: 409 });
    // Parse errors from CSV library
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
