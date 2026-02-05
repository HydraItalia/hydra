"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DriverOnboardingInput } from "@/lib/schemas/driver-onboarding";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENTS,
  type DriverDocumentType,
} from "@/lib/schemas/driver-onboarding";

interface Props {
  form: UseFormReturn<DriverOnboardingInput>;
  disabled?: boolean;
}

export function DocumentsStep({ form, disabled }: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  // Watch documents for real-time updates (fields array is stale on type changes)
  const watchedDocuments = form.watch("documents");

  // Check which required documents are missing
  const addedTypes = (watchedDocuments || []).map((d) => d.type);
  const missingRequired = REQUIRED_DOCUMENTS.filter(
    (type) => !addedTypes.includes(type)
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        List the documents you will provide. File uploads will be available after
        registration approval.
      </p>

      {/* Required documents indicator */}
      {missingRequired.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Required documents:</p>
            <ul className="mt-1 text-amber-700">
              {missingRequired.map((type) => (
                <li key={type}>• {DOCUMENT_TYPE_LABELS[type]}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
          No documents added yet. Click &quot;Add Document&quot; to begin.
        </div>
      )}

      {fields.map((field, index) => {
        const isRequired = REQUIRED_DOCUMENTS.includes(field.type as DriverDocumentType);
        return (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end border rounded-md p-3"
          >
            <FormField
              control={form.control}
              name={`documents.${index}.type`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Type
                    {isRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={f.onChange}
                    value={f.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger aria-label={`Document ${index + 1} type`}>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {DOCUMENT_TYPE_LABELS[type]}
                          {REQUIRED_DOCUMENTS.includes(type) && " *"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`documents.${index}.label`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Document description"
                      aria-label={`Document ${index + 1} label`}
                      {...f}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove document ${index + 1}`}
              onClick={() => remove(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            type: "ID_DOCUMENT" as const,
            label: "",
            fileName: "",
            notes: "",
          })
        }
        disabled={disabled}
        aria-label="Add document"
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Document
      </Button>

      {/* Show root-level array error */}
      {form.formState.errors.documents?.root && (
        <p className="text-sm text-destructive">
          {form.formState.errors.documents.root.message}
        </p>
      )}
      {form.formState.errors.documents?.message && (
        <p className="text-sm text-destructive">
          {form.formState.errors.documents.message}
        </p>
      )}
    </div>
  );
}
