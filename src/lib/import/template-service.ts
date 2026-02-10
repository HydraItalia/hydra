/**
 * Import Template service layer.
 * Handles CRUD, ownership checks, and template suggestion for CSV imports.
 */

import { prisma } from "@/lib/prisma";
import { ImportTemplateStatus, Prisma } from "@prisma/client";
import { logAction, AuditAction } from "@/lib/audit";
import { suggestTemplate } from "@/lib/import/catalog-csv";
import type {
  TemplateMapping,
  TemplateSuggestion,
} from "@/lib/import/catalog-csv";

// ── Types ────────────────────────────────────────────────────────────────────

export type TemplateListItem = {
  id: string;
  vendorId: string;
  name: string;
  mapping: TemplateMapping;
  defaults: Record<string, string> | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type TemplateSuggestionResult = TemplateSuggestion;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toListItem(t: {
  id: string;
  vendorId: string;
  name: string;
  mapping: Prisma.JsonValue;
  defaults: Prisma.JsonValue;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): TemplateListItem {
  return {
    id: t.id,
    vendorId: t.vendorId,
    name: t.name,
    mapping: t.mapping as TemplateMapping,
    defaults: (t.defaults as Record<string, string>) ?? null,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

async function verifyTemplateOwnership(
  templateId: string,
  vendorId: string | null,
  role: string,
) {
  const template = await prisma.importTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("Template not found");
  if (role === "VENDOR") {
    if (!vendorId || template.vendorId !== vendorId)
      throw new Error("Forbidden");
  } else if (role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return template;
}

// ── Service functions ────────────────────────────────────────────────────────

export async function createTemplate(
  vendorId: string,
  name: string,
  mapping: TemplateMapping,
  defaults?: Record<string, string>,
): Promise<TemplateListItem> {
  const template = await prisma.importTemplate.create({
    data: {
      vendorId,
      name,
      mapping: mapping as unknown as Prisma.InputJsonValue,
      defaults: defaults
        ? (defaults as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  try {
    await logAction({
      entityType: "ImportTemplate",
      entityId: template.id,
      action: AuditAction.IMPORT_TEMPLATE_CREATED,
      diff: { vendorId, name },
    });
  } catch {
    // Audit failure is non-fatal
  }

  return toListItem(template);
}

export async function listTemplates(
  vendorId: string | null,
  role: string,
  includeArchived = false,
): Promise<TemplateListItem[]> {
  if (role !== "ADMIN" && role !== "VENDOR") {
    throw new Error("Forbidden");
  }

  const where: Prisma.ImportTemplateWhereInput = {};
  if (role === "VENDOR") {
    if (!vendorId) throw new Error("Vendor user has no associated vendor");
    where.vendorId = vendorId;
  }
  if (!includeArchived) {
    where.status = ImportTemplateStatus.ACTIVE;
  }

  const templates = await prisma.importTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return templates.map(toListItem);
}

export async function getTemplate(
  templateId: string,
  vendorId: string | null,
  role: string,
): Promise<TemplateListItem> {
  const template = await verifyTemplateOwnership(templateId, vendorId, role);
  return toListItem(template);
}

export async function updateTemplate(
  templateId: string,
  vendorId: string | null,
  role: string,
  patch: {
    name?: string;
    mapping?: TemplateMapping;
    defaults?: Record<string, string> | null;
  },
): Promise<TemplateListItem> {
  await verifyTemplateOwnership(templateId, vendorId, role);

  const data: Prisma.ImportTemplateUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.mapping !== undefined)
    data.mapping = patch.mapping as unknown as Prisma.InputJsonValue;
  if (patch.defaults !== undefined)
    data.defaults =
      patch.defaults === null
        ? Prisma.JsonNull
        : (patch.defaults as unknown as Prisma.InputJsonValue);

  const updated = await prisma.importTemplate.update({
    where: { id: templateId },
    data,
  });

  try {
    await logAction({
      entityType: "ImportTemplate",
      entityId: templateId,
      action: AuditAction.IMPORT_TEMPLATE_UPDATED,
      diff: { updatedFields: Object.keys(patch) },
    });
  } catch {
    // Audit failure is non-fatal
  }

  return toListItem(updated);
}

export async function archiveTemplate(
  templateId: string,
  vendorId: string | null,
  role: string,
): Promise<void> {
  await verifyTemplateOwnership(templateId, vendorId, role);

  await prisma.importTemplate.update({
    where: { id: templateId },
    data: { status: ImportTemplateStatus.ARCHIVED },
  });

  try {
    await logAction({
      entityType: "ImportTemplate",
      entityId: templateId,
      action: AuditAction.IMPORT_TEMPLATE_ARCHIVED,
    });
  } catch {
    // Audit failure is non-fatal
  }
}

export async function suggestTemplateForCsv(
  vendorId: string,
  csvHeaders: string[],
): Promise<TemplateSuggestionResult | null> {
  const templates = await prisma.importTemplate.findMany({
    where: { vendorId, status: ImportTemplateStatus.ACTIVE },
  });

  if (templates.length === 0) return null;

  return suggestTemplate(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      mapping: t.mapping as TemplateMapping,
    })),
    csvHeaders,
  );
}
