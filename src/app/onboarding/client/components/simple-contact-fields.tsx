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
import type { ClientOnboardingInput } from "@/lib/schemas/client-onboarding";

interface SimpleContactFieldsProps {
  form: UseFormReturn<ClientOnboardingInput>;
  prefix: "adminContact" | "operationalContact";
  disabled?: boolean;
  optional?: boolean;
}

export function SimpleContactFields({
  form,
  prefix,
  disabled,
  optional,
}: SimpleContactFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <FormField
        control={form.control}
        name={`${prefix}.fullName` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name{!optional && " *"}</FormLabel>
            <FormControl>
              <Input
                placeholder="Mario Rossi"
                {...field}
                value={field.value ?? ""}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.email` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email{!optional && " *"}</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="mario@example.com"
                {...field}
                value={field.value ?? ""}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.phone` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone{!optional && " *"}</FormLabel>
            <FormControl>
              <Input
                placeholder="+39 xxx xxx xxxx"
                {...field}
                value={field.value ?? ""}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
