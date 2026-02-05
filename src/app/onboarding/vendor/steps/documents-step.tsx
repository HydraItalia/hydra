"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
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
import type { VendorOnboardingInput } from "@/lib/schemas/vendor-onboarding";

interface Props {
  form: UseFormReturn<VendorOnboardingInput>;
  disabled?: boolean;
}

const DOC_TYPES = [
  { value: "CHAMBER_OF_COMMERCE_EXTRACT", label: "Chamber of Commerce Extract" },
  { value: "LEGAL_REP_ID", label: "Legal Representative ID" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "SIGNED_CONTRACT", label: "Signed Contract" },
  { value: "SIGNED_GDPR_FORM", label: "Signed GDPR Form" },
  { value: "OTHER", label: "Other" },
] as const;

export function DocumentsStep({ form, disabled }: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        List documents you will provide. File uploads will be available after registration.
      </p>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end border rounded-md p-3"
        >
          <FormField
            control={form.control}
            name={`documents.${index}.type`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={f.onChange}
                  value={f.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DOC_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
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
                    placeholder="Document name"
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
            onClick={() => remove(index)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            type: "CHAMBER_OF_COMMERCE_EXTRACT",
            label: "",
            fileName: "",
            notes: "",
          })
        }
        disabled={disabled}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Document
      </Button>
    </div>
  );
}
