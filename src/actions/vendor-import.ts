"use server";

import { currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createBatch,
  parseBatch,
  getBatchDetail,
  getBatchRows,
  validateBatch,
  commitBatch,
  getErrorRowsCsv,
  listBatches,
} from "@/lib/import/batch-service";
import type {
  BatchDetail,
  BatchListItem,
  BatchRow,
} from "@/lib/import/batch-service";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function getVendorAuth() {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" } as const;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    return { error: "Unauthorized" } as const;
  }

  let vendorId: string | null = null;
  if (user.role === "VENDOR") {
    if (!user.vendorId) {
      return { error: "No vendor associated with this account" } as const;
    }
    vendorId = user.vendorId;
  }

  return { user, vendorId } as const;
}

export async function createImportBatch(
  filename?: string,
): Promise<ActionResult<{ batchId: string }>> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    if (!vendorId) {
      return { success: false, error: "vendorId is required" };
    }

    const result = await createBatch(vendorId, user.id, filename);
    return { success: true, data: { batchId: result.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create batch",
    };
  }
}

export async function parseImportBatch(
  batchId: string,
  csvText: string,
): Promise<ActionResult<{ rowCount: number }>> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    const result = await parseBatch(
      batchId,
      csvText,
      user.id,
      vendorId,
      user.role,
    );
    return { success: true, data: { rowCount: result.rowCount } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse CSV",
    };
  }
}

export async function getImportBatches(page?: number): Promise<
  ActionResult<{
    data: BatchListItem[];
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  }>
> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    const result = await listBatches({
      vendorId,
      role: user.role,
      page: page || 1,
    });
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch batches",
    };
  }
}

export async function getImportBatchDetail(
  batchId: string,
  page?: number,
): Promise<ActionResult<BatchDetail>> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    const result = await getBatchDetail(
      batchId,
      page || 1,
      vendorId,
      user.role,
    );
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch batch detail",
    };
  }
}

export async function getImportBatchRows(
  batchId: string,
  opts?: { page?: number; statusFilter?: string },
): Promise<
  ActionResult<{
    rows: BatchRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    const result = await getBatchRows(batchId, {
      ...opts,
      vendorId,
      role: user.role,
    });
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch batch rows",
    };
  }
}

export async function validateImportBatch(
  batchId: string,
): Promise<ActionResult<{ rowCount: number; errorCount: number }>> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    const result = await validateBatch(batchId, user.id, vendorId, user.role);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to validate batch",
    };
  }
}

export async function commitImportBatch(
  batchId: string,
  mode: "all" | "valid_only",
): Promise<
  ActionResult<{
    committedRows: number;
    newProducts: number;
    updatedProducts: number;
  }>
> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    const result = await commitBatch(
      batchId,
      user.id,
      mode,
      vendorId,
      user.role,
    );
    revalidatePath("/dashboard/inventory");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to commit batch",
    };
  }
}

export async function downloadImportErrors(
  batchId: string,
): Promise<ActionResult<string>> {
  try {
    const auth = await getVendorAuth();
    if ("error" in auth) return { success: false, error: auth.error };
    const { user, vendorId } = auth;

    const csv = await getErrorRowsCsv(batchId, vendorId, user.role);
    return { success: true, data: csv };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to download error rows",
    };
  }
}
