"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ClientOnboardingInput } from "@/lib/schemas/client-onboarding";

interface OperationalStepProps {
  form: UseFormReturn<ClientOnboardingInput>;
  disabled?: boolean;
}

export function OperationalStep({ form, disabled }: OperationalStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Operational Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Help us serve you better by providing your operational preferences.
        </p>
      </div>

      <FormField
        control={form.control}
        name="preferredContactHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Contact Hours</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Monday-Friday 9:00-17:00"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>
              When is the best time to reach you?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="specialRequirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Requirements</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any special delivery requirements, access instructions, dietary restrictions..."
                className="resize-none"
                rows={3}
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>
              Let us know about any special needs or requirements
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="operationalNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any other information that might be helpful..."
                className="resize-none"
                rows={4}
                {...field}
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
