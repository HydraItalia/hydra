"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AddressFields } from "../components/address-fields";
import type { VendorOnboardingInput } from "@/lib/schemas/vendor-onboarding";

interface Props {
  form: UseFormReturn<VendorOnboardingInput>;
  disabled?: boolean;
}

export function LegalTaxStep({ form, disabled }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="vatNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VAT Number (P.IVA)</FormLabel>
              <FormControl>
                <Input
                  placeholder="IT12345678901"
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
          name="taxCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Code (C.F.)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Codice Fiscale"
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
      <FormField
        control={form.control}
        name="chamberOfCommerceRegistration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Chamber of Commerce Registration</FormLabel>
            <FormControl>
              <Input
                placeholder="Registration number"
                {...field}
                value={field.value ?? ""}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <p className="text-sm font-medium">Registered Office Address</p>
      <AddressFields
        form={form}
        prefix="registeredOfficeAddress"
        disabled={disabled}
      />

      <Separator />
      <p className="text-sm font-medium">
        Operating Address{" "}
        <span className="text-muted-foreground">(if different)</span>
      </p>
      <AddressFields
        form={form}
        prefix="operatingAddress"
        disabled={disabled}
      />

      <Separator />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="pecEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PEC Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="company@pec.it"
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
          name="sdiRecipientCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SDI Recipient Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. ABCDEFG"
                  maxLength={7}
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
      <FormField
        control={form.control}
        name="taxRegime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax Regime</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Regime Ordinario"
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
        name="licenses"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Licenses / Certifications</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any relevant licenses..."
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
