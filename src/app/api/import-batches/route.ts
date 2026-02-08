import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { createImportBatchSchema } from "@/lib/schemas/import";

/** POST /api/import-batches — Create a new import batch (metadata only) */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN and VENDOR can create import batches
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

    // Determine vendorId: VENDOR role always uses their own, ADMIN can specify
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
      // ADMIN
      if (!parsed.data.vendorId) {
        return NextResponse.json(
          { error: "vendorId is required for admin" },
          { status: 400 },
        );
      }
      vendorId = parsed.data.vendorId;
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const batch = await prisma.importBatch.create({
      data: {
        vendorId,
        createdByUserId: user.id,
        status: "DRAFT",
        sourceType: "TEXT",
        originalFilename: parsed.data.filename || null,
      },
    });

    await logAction({
      entityType: "ImportBatch",
      entityId: batch.id,
      action: AuditAction.IMPORT_BATCH_CREATED,
      diff: { vendorId, filename: parsed.data.filename },
    });

    return NextResponse.json(
      {
        id: batch.id,
        vendorId: batch.vendorId,
        status: batch.status,
        createdAt: batch.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Import batch creation error:", error);
    return NextResponse.json(
      { error: "Failed to create import batch" },
      { status: 500 },
    );
  }
}
