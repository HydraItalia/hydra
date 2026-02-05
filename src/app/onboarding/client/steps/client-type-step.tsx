"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { ClientOnboardingInput } from "@/lib/schemas/client-onboarding";
import { Building2, User, Users, Handshake } from "lucide-react";

interface ClientTypeStepProps {
  form: UseFormReturn<ClientOnboardingInput>;
  disabled?: boolean;
}

const CLIENT_TYPES = [
  {
    value: "PRIVATE",
    label: "Private Individual",
    description: "Personal account for individual customers",
    icon: User,
  },
  {
    value: "COMPANY",
    label: "Company",
    description: "Business account for companies and organizations",
    icon: Building2,
  },
  {
    value: "RESELLER",
    label: "Reseller",
    description: "Reseller account with special pricing",
    icon: Users,
  },
  {
    value: "PARTNER",
    label: "Partner",
    description: "Strategic partner account",
    icon: Handshake,
  },
] as const;

export function ClientTypeStep({ form, disabled }: ClientTypeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Select Client Type</h3>
        <p className="text-sm text-muted-foreground">
          Choose the type of account that best describes you. This determines
          which information we&apos;ll need to collect.
        </p>
      </div>

      <FormField
        control={form.control}
        name="clientType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Client Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                disabled={disabled}
              >
                {CLIENT_TYPES.map(
                  ({ value, label, description, icon: Icon }) => (
                    <FormItem key={value}>
                      <FormControl>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                            field.value === value
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/50",
                            disabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <RadioGroupItem
                            value={value}
                            className="mt-1"
                            disabled={disabled}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {description}
                            </p>
                          </div>
                        </label>
                      </FormControl>
                    </FormItem>
                  ),
                )}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
