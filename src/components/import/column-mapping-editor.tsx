"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CANONICAL_FIELDS } from "@/lib/import/canonical-fields";

interface ColumnMappingEditorProps {
  csvHeaders: string[];
  selections: Record<string, string>;
  onChange: (selections: Record<string, string>) => void;
  showUnmapped?: boolean;
}

const SKIP_VALUE = "__skip__";

export function ColumnMappingEditor({
  csvHeaders,
  selections,
  onChange,
  showUnmapped,
}: ColumnMappingEditorProps) {
  const sortedFields = [
    ...CANONICAL_FIELDS.filter((f) => f.required),
    ...CANONICAL_FIELDS.filter((f) => !f.required),
  ];

  const assignedHeaders = new Set(Object.values(selections));

  const handleChange = (fieldKey: string, value: string) => {
    const next = { ...selections };
    if (value === SKIP_VALUE) {
      delete next[fieldKey];
    } else {
      next[fieldKey] = value;
    }
    onChange(next);
  };

  const unmappedHeaders = csvHeaders.filter((h) => !assignedHeaders.has(h));

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {sortedFields.map((field) => {
          const selected = selections[field.key] || "";
          const isMissing = field.required && !selected;

          return (
            <div
              key={field.key}
              className="grid grid-cols-[1fr_1fr] sm:grid-cols-[200px_1fr] items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                {field.required && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    Required
                  </Badge>
                )}
              </div>
              <div>
                <Select
                  value={selected || SKIP_VALUE}
                  onValueChange={(v) => handleChange(field.key, v)}
                >
                  <SelectTrigger className={isMissing ? "border-red-300" : ""}>
                    <SelectValue placeholder="— Skip —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SKIP_VALUE}>— Skip —</SelectItem>
                    {csvHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isMissing && (
                  <p className="text-xs text-red-500 mt-1">Required</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showUnmapped && unmappedHeaders.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">
            Unmapped CSV columns:
          </p>
          <div className="flex flex-wrap gap-1">
            {unmappedHeaders.map((h) => (
              <Badge key={h} variant="outline" className="text-xs font-normal">
                {h}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
