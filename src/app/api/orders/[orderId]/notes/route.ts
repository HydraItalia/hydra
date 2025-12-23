import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  // Require ADMIN or AGENT role (outside try-catch for proper error codes)
  await requireRole("ADMIN", "AGENT");

  try {
    const { orderId } = await context.params;
    const body = await request.json();
    const { notes } = body;

    // Validate input (allow null to clear notes)
    if (typeof notes !== "string" && notes !== null) {
      return NextResponse.json(
        { error: "Invalid notes format" },
        { status: 400 }
      );
    }

    // Fetch current order to get old notes
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { notes: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Transform notes (trim and convert empty to null, handle explicit null)
    const trimmedNotes = notes === null ? null : notes.trim() || null;

    // Update notes
    await prisma.order.update({
      where: { id: orderId },
      data: { notes: trimmedNotes },
    });

    // Log the notes update
    await logAction({
      entityType: "Order",
      entityId: orderId,
      action: AuditAction.ORDER_NOTES_UPDATED,
      diff: {
        field: "notes",
        from: currentOrder.notes,
        to: trimmedNotes,
      },
    });

    // Revalidate the order detail page
    revalidatePath(`/dashboard/orders/${orderId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order notes:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update notes",
      },
      { status: 500 }
    );
  }
}
