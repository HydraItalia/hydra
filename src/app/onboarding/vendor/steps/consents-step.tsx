"use client";

import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { VendorOnboardingInput } from "@/lib/schemas/vendor-onboarding";

interface Props {
  form: UseFormReturn<VendorOnboardingInput>;
  disabled?: boolean;
}

export function ConsentsStep({ form, disabled }: Props) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="dataProcessingConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Data Processing Consent *</FormLabel>
              <p className="text-sm text-muted-foreground">
                I consent to the processing of the personal data provided in
                this form in accordance with applicable data protection
                regulations.
              </p>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="marketingConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Marketing Communications</FormLabel>
              <p className="text-sm text-muted-foreground">
                I consent to receiving marketing and promotional communications.
              </p>
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="logoUsageConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Logo Usage</FormLabel>
              <p className="text-sm text-muted-foreground">
                I authorize the use of our company logo on the Hydra platform.
              </p>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
