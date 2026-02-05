"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
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
import { ID_DOCUMENT_TYPES } from "@/lib/schemas/driver-onboarding";

interface Props {
  form: UseFormReturn<DriverOnboardingInput>;
  disabled?: boolean;
}

const ID_DOCUMENT_LABELS: Record<(typeof ID_DOCUMENT_TYPES)[number], string> = {
  ID_CARD: "Carta d'Identità",
  PASSPORT: "Passaporto",
  DRIVING_LICENSE: "Patente di Guida",
};

export function IdentityDocumentStep({ form, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Provide details of a valid identity document. This will be verified
        during the approval process.
      </p>

      <FormField
        control={form.control}
        name="idDocumentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Document Type *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ID_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ID_DOCUMENT_LABELS[type]}
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
        name="idDocumentNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Document Number *</FormLabel>
            <FormControl>
              <Input
                placeholder="CA12345AA"
                {...field}
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
          name="idDocumentIssuer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issuing Authority *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Comune di Roma"
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
          name="idDocumentExpiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
