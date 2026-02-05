"use client";

import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ClientOnboardingInput } from "@/lib/schemas/client-onboarding";

interface ConsentsStepProps {
  form: UseFormReturn<ClientOnboardingInput>;
  disabled?: boolean;
}

export function ConsentsStep({ form, disabled }: ConsentsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Consents & Agreements</h3>
        <p className="text-sm text-muted-foreground">
          Please review and accept the required terms to complete your
          registration.
        </p>
      </div>

      <div className="space-y-4">
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
                <FormLabel className="text-base">
                  Data Processing Consent *
                </FormLabel>
                <FormDescription>
                  I consent to the processing of my personal data in accordance
                  with the Privacy Policy and GDPR regulations. I understand
                  that my data will be used for account management, order
                  processing, and communication purposes.
                </FormDescription>
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
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-base">Marketing Consent</FormLabel>
                <FormDescription>
                  I agree to receive promotional communications, newsletters,
                  and special offers via email. You can unsubscribe at any time.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
        <p className="font-medium mb-2">Important Information:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Your data will be processed in compliance with GDPR and Italian
            privacy laws.
          </li>
          <li>
            You can request access, correction, or deletion of your data at any
            time.
          </li>
          <li>
            For questions about data processing, contact our privacy team.
          </li>
        </ul>
      </div>
    </div>
  );
}
