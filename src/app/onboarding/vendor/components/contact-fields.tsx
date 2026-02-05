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
import type { VendorOnboardingInput } from "@/lib/schemas/vendor-onboarding";

interface ContactFieldsProps {
  form: UseFormReturn<VendorOnboardingInput>;
  prefix: "adminContact" | "commercialContact" | "technicalContact";
  showRole?: boolean;
  disabled?: boolean;
}

export function ContactFields({
  form,
  prefix,
  showRole = true,
  disabled,
}: ContactFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        control={form.control}
        name={`${prefix}.fullName` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
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
      {showRole && (
        <FormField
          control={form.control}
          name={`${prefix}.role` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. CFO, Sales Manager"
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={form.control}
        name={`${prefix}.email` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="name@company.it"
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
            <FormLabel>Phone</FormLabel>
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
