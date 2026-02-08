import { z } from "zod";

/** POST /api/import-batches — create batch */
export const createImportBatchSchema = z.object({
  vendorId: z.string().min(1).optional(), // Required for ADMIN, derived for VENDOR
  filename: z.string().max(255).optional(),
});

/** POST /api/import-batches/[batchId]/parse — parse CSV text */
export const parseImportBatchSchema = z.object({
  csvText: z.string().min(1, "CSV text is required"),
});

/** POST /api/import-batches/[batchId]/commit — commit mode query param */
export const commitModeSchema = z.enum(["all", "valid_only"]).default("all");

/** GET /api/import-batches/[batchId] — pagination query params */
export const batchDetailQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
