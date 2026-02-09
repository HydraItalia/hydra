import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createImportBatchSchema } from "@/lib/schemas/import";
import { createBatch } from "@/lib/import/batch-service";

/** POST /api/import-batches — Create a new import batch (metadata only) */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN" && user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createImportBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    let vendorId: string;
    if (user.role === "VENDOR") {
      if (!user.vendorId) {
        return NextResponse.json(
          { error: "Vendor user has no associated vendor" },
          { status: 400 },
        );
      }
      vendorId = user.vendorId;
    } else {
      if (!parsed.data.vendorId) {
        return NextResponse.json(
          { error: "vendorId is required for admin" },
          { status: 400 },
        );
      }
      vendorId = parsed.data.vendorId;
    }

    const result = await createBatch(vendorId, user.id, parsed.data.filename);

    return NextResponse.json(
      { ...result, createdAt: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create import batch";
    const status = message === "Vendor not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
