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
import type { DriverOnboardingInput } from "@/lib/schemas/driver-onboarding";
import {
  LICENSE_TYPES,
  LICENSE_TYPE_LABELS,
} from "@/lib/schemas/driver-onboarding";

interface Props {
  form: UseFormReturn<DriverOnboardingInput>;
  disabled?: boolean;
}

export function LicensesStep({ form, disabled }: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "licenses",
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add your driving licenses and professional certifications (CQC, ADR, etc.).
        At least one license is required.
      </p>

      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
          No licenses added yet. Click &quot;Add License&quot; to begin.
        </div>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="border rounded-md p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">License {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove license ${index + 1}`}
              onClick={() => remove(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name={`licenses.${index}.type`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>License Type *</FormLabel>
                  <Select
                    onValueChange={f.onChange}
                    value={f.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger aria-label={`License ${index + 1} type`}>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LICENSE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {LICENSE_TYPE_LABELS[type]}
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
              name={`licenses.${index}.number`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>License Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="AB12345678"
                      aria-label={`License ${index + 1} number`}
                      {...f}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={`licenses.${index}.issuingAuthority`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Issuing Authority *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Motorizzazione Civile di Roma"
                    aria-label={`License ${index + 1} issuing authority`}
                    {...f}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name={`licenses.${index}.issueDate`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Issue Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      aria-label={`License ${index + 1} issue date`}
                      {...f}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`licenses.${index}.expiryDate`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Expiry Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      aria-label={`License ${index + 1} expiry date`}
                      {...f}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            type: "B" as const,
            number: "",
            issueDate: "",
            expiryDate: "",
            issuingAuthority: "",
            isCertification: false, // Computed by Zod transform, but RHF needs it
          })
        }
        disabled={disabled}
        aria-label="Add license"
      >
        <Plus className="mr-1 h-4 w-4" />
        Add License
      </Button>

      {/* Show root-level array error */}
      {form.formState.errors.licenses?.root && (
        <p className="text-sm text-destructive">
          {form.formState.errors.licenses.root.message}
        </p>
      )}
      {form.formState.errors.licenses?.message && (
        <p className="text-sm text-destructive">
          {form.formState.errors.licenses.message}
        </p>
      )}
    </div>
  );
}
