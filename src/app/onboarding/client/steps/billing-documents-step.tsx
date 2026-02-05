"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
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
import { Plus, Trash2 } from "lucide-react";
import type { ClientOnboardingInput } from "@/lib/schemas/client-onboarding";

interface BillingDocumentsStepProps {
  form: UseFormReturn<ClientOnboardingInput>;
  disabled?: boolean;
  isPrivate: boolean;
}

const DOCUMENT_TYPES = [
  { value: "ID_DOCUMENT", label: "ID Document" },
  { value: "TAX_CODE", label: "Tax Code Certificate" },
  { value: "SIGNED_GDPR_FORM", label: "Signed GDPR Form" },
  { value: "OTHER", label: "Other" },
];

export function BillingDocumentsStep({
  form,
  disabled,
  isPrivate,
}: BillingDocumentsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing & Documents</h3>
        <p className="text-sm text-muted-foreground">
          Invoicing preferences and required document information.
        </p>
      </div>

      {/* Invoicing Notes */}
      <FormField
        control={form.control}
        name="invoicingNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Invoicing Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any special invoicing requirements or notes..."
                className="resize-none"
                rows={3}
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>
              Special instructions for invoice generation
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Documents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Documents</h4>
            <p className="text-sm text-muted-foreground">
              Add metadata for required documents. Actual file upload will be
              available later.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                type: isPrivate ? "ID_DOCUMENT" : "TAX_CODE",
                label: "",
                fileName: "",
                notes: "",
              })
            }
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Document
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg">
            No documents added yet. Click &quot;Add Document&quot; to add
            document metadata.
          </p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 border rounded-lg relative"
            >
              <FormField
                control={form.control}
                name={`documents.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Document description"
                        {...field}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`documents.${index}.notes`}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Additional notes"
                          {...field}
                          disabled={disabled}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={disabled}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
