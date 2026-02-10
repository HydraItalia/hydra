"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColumnMappingEditor } from "./column-mapping-editor";
import {
  REQUIRED_CANONICAL_KEYS,
  buildTemplateMappingFromSelections,
} from "@/lib/import/canonical-fields";
import {
  updateImportTemplate,
} from "@/actions/vendor-import";
import type { TemplateListItem } from "@/lib/import/template-service";

interface TemplateEditDialogProps {
  template?: TemplateListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function deriveSelectionsFromMapping(
  template: TemplateListItem,
): { selections: Record<string, string>; headers: string[] } {
  const selections: Record<string, string> = {};
  const headers: string[] = [];

  for (const [canonicalField, config] of Object.entries(template.mapping)) {
    if (config.sources.length > 0) {
      const source = config.sources[0];
      selections[canonicalField] = source;
      if (!headers.includes(source)) {
        headers.push(source);
      }
    }
  }

  return { selections, headers };
}

export function TemplateEditDialog({
  template,
  open,
  onOpenChange,
  onSaved,
}: TemplateEditDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      const derived = deriveSelectionsFromMapping(template);
      setName(template.name);
      setSelections(derived.selections);
      setCsvHeaders(derived.headers);
    } else {
      setName("");
      setSelections({});
      setCsvHeaders([]);
    }
  }, [template]);

  const allRequiredMapped = REQUIRED_CANONICAL_KEYS.every(
    (key) => !!selections[key],
  );
  const canSave = name.trim() && allRequiredMapped && !isPending;

  const handleSave = () => {
    if (!canSave || !template) return;

    startTransition(async () => {
      const mapping = buildTemplateMappingFromSelections(selections);
      const result = await updateImportTemplate(template.id, {
        name: name.trim(),
        mapping,
      });

      if (result.success) {
        toast.success("Template updated");
        onSaved();
      } else {
        toast.error(result.error || "Failed to update template");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Update the template name and column mappings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Italian supplier format"
            />
          </div>

          {csvHeaders.length > 0 && (
            <div className="space-y-2">
              <Label>Column Mappings</Label>
              <ColumnMappingEditor
                csvHeaders={csvHeaders}
                selections={selections}
                onChange={setSelections}
              />
            </div>
          )}

          {csvHeaders.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Column mappings will be derived from the template&apos;s saved sources.
              Re-import a CSV to update column mappings.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
