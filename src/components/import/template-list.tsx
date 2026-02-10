"use client";

import { useState, useEffect, useTransition } from "react";
import { Pencil, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getImportTemplates,
  archiveImportTemplate,
} from "@/actions/vendor-import";
import type { TemplateListItem } from "@/lib/import/template-service";
import { TemplateEditDialog } from "./template-edit-dialog";

export function TemplateList() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState<
    TemplateListItem | undefined
  >();
  const [editOpen, setEditOpen] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await getImportTemplates();
      if (result.success && result.data) {
        setTemplates(result.data);
      } else {
        toast.error(result.error || "Failed to load templates");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleEdit = (template: TemplateListItem) => {
    setEditTemplate(template);
    setEditOpen(true);
  };

  const handleSaved = () => {
    setEditOpen(false);
    setEditTemplate(undefined);
    loadTemplates();
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading templates...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No templates yet. Templates are created during CSV import.
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="rounded-lg border min-w-full inline-block align-middle">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                  Fields Mapped
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                  Created
                </th>
                <th className="py-3 px-4 w-24">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const fieldCount = Object.keys(template.mapping).length;
                const fieldNames = Object.keys(template.mapping).join(", ");

                return (
                  <tr key={template.id} className="border-t hover:bg-muted/50">
                    <td className="py-2 px-4 text-sm font-medium">
                      {template.name}
                    </td>
                    <td className="py-2 px-4 text-sm text-muted-foreground">
                      <span title={fieldNames}>{fieldCount} fields</span>
                    </td>
                    <td className="py-2 px-4 text-sm text-muted-foreground">
                      {new Date(template.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Edit template"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ArchiveButton
                          templateId={template.id}
                          templateName={template.name}
                          onArchived={loadTemplates}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TemplateEditDialog
        template={editTemplate}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleSaved}
      />
    </>
  );
}

function ArchiveButton({
  templateId,
  templateName,
  onArchived,
}: {
  templateId: string;
  templateName: string;
  onArchived: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveImportTemplate(templateId);
      if (result.success) {
        toast.success(`Template "${templateName}" archived`);
        onArchived();
      } else {
        toast.error(result.error || "Failed to archive template");
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          disabled={isPending}
          title="Archive template"
        >
          <Archive className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this template?</AlertDialogTitle>
          <AlertDialogDescription>
            Template &ldquo;{templateName}&rdquo; will be archived and no longer
            suggested during imports. You can still view archived templates.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
