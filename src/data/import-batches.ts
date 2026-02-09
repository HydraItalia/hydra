"use server";

import { requireRole } from "@/lib/auth";
import { listBatches, getBatchDetail } from "@/lib/import/batch-service";
import type { BatchListItem, BatchDetail } from "@/lib/import/batch-service";

export type ImportBatchFilters = {
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function fetchAllImportBatches(
  filters: ImportBatchFilters = {},
): Promise<{
  data: BatchListItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}> {
  await requireRole("ADMIN");

  const { status, page = 1, pageSize = 20 } = filters;

  return listBatches({
    role: "ADMIN",
    page,
    pageSize,
    statusFilter: status,
  });
}

export async function fetchImportBatchDetail(
  batchId: string,
  page: number = 1,
): Promise<BatchDetail> {
  await requireRole("ADMIN");

  return getBatchDetail(batchId, page, null, "ADMIN");
}
