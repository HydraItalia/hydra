"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AddressFields } from "../components/address-fields";
import { SimpleContactFields } from "../components/simple-contact-fields";
import type { ClientOnboardingInput } from "@/lib/schemas/client-onboarding";

interface CompanyDetailsStepProps {
  form: UseFormReturn<ClientOnboardingInput>;
  disabled?: boolean;
}

export function CompanyDetailsStep({
  form,
  disabled,
}: CompanyDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Company Details</h3>
        <p className="text-sm text-muted-foreground">
          Please provide your company information for account registration.
        </p>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Azienda S.r.l."
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
          name="tradeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trade Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brand Name"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Trading name if different from legal name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vatNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VAT Number (P.IVA) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="IT12345678901"
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
          name="companyTaxCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Code (Codice Fiscale)</FormLabel>
              <FormControl>
                <Input
                  placeholder="12345678901"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>If different from VAT number</FormDescription>
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
                  placeholder="ABC1234"
                  maxLength={7}
                  {...field}
                  disabled={disabled}
                  className="uppercase"
                />
              </FormControl>
              <FormDescription>
                7-character code for electronic invoicing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyPecEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PEC Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="azienda@pec.it"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>Certified email for invoicing</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Registered Office Address */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Registered Office Address *</h4>
        <AddressFields
          form={form}
          prefix="registeredOfficeAddress"
          disabled={disabled}
        />
      </div>

      {/* Operating Address (optional) */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">
          Operating Address{" "}
          <span className="text-muted-foreground font-normal">
            (if different from registered)
          </span>
        </h4>
        <AddressFields
          form={form}
          prefix="operatingAddress"
          disabled={disabled}
        />
      </div>

      {/* Admin Contact */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Admin Contact *</h4>
        <p className="text-sm text-muted-foreground">
          Primary contact for account administration
        </p>
        <SimpleContactFields
          form={form}
          prefix="adminContact"
          disabled={disabled}
        />
      </div>

      {/* Operational Contact */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">
          Operational Contact{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </h4>
        <p className="text-sm text-muted-foreground">
          Day-to-day contact for orders and deliveries
        </p>
        <SimpleContactFields
          form={form}
          prefix="operationalContact"
          disabled={disabled}
          optional
        />
      </div>
    </div>
  );
}
