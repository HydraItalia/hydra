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
import type { AgentOnboardingInput } from "@/lib/schemas/agent-onboarding";

interface AddressFieldsProps {
  form: UseFormReturn<AgentOnboardingInput>;
  prefix: "residentialAddress" | "domicileAddress";
  disabled?: boolean;
}

const FIELDS = [
  { key: "street", label: "Via/Indirizzo", placeholder: "Via Roma 1" },
  { key: "city", label: "Città", placeholder: "Milano" },
  { key: "province", label: "Provincia", placeholder: "MI" },
  { key: "postalCode", label: "CAP", placeholder: "20100" },
  { key: "country", label: "Paese", placeholder: "Italia" },
] as const;

export function AddressFields({ form, prefix, disabled }: AddressFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELDS.map(({ key, label, placeholder }) => (
        <FormField
          key={key}
          control={form.control}
          name={`${prefix}.${key}` as any}
          render={({ field }) => (
            <FormItem className={key === "street" ? "col-span-2" : ""}>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input
                  placeholder={placeholder}
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
