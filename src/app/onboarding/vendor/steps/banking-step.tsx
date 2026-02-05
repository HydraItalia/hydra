"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export function BankingStep({ form, disabled }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="bankAccountHolder"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Holder Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Company S.r.l."
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
        name="iban"
        render={({ field }) => (
          <FormItem>
            <FormLabel>IBAN</FormLabel>
            <FormControl>
              <Input
                placeholder="IT60X0542811101000000123456"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value.toUpperCase().replace(/\s/g, ""),
                  )
                }
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="bankNameAndBranch"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Name & Branch</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Intesa Sanpaolo - Roma Termini"
                {...field}
                value={field.value ?? ""}
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
          name="preferredPaymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="DIRECT_DEBIT">Direct Debit</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NET_30">Net 30</SelectItem>
                  <SelectItem value="NET_60">Net 60</SelectItem>
                  <SelectItem value="NET_90">Net 90</SelectItem>
                  <SelectItem value="ON_DELIVERY">On Delivery</SelectItem>
                  <SelectItem value="PREPAID">Prepaid</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="invoicingNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Invoicing Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any special invoicing requirements..."
                rows={2}
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
