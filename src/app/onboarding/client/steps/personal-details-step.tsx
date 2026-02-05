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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressFields } from "../components/address-fields";
import type { ClientOnboardingInput } from "@/lib/schemas/client-onboarding";

interface PersonalDetailsStepProps {
  form: UseFormReturn<ClientOnboardingInput>;
  disabled?: boolean;
}

const ID_DOCUMENT_TYPES = [
  { value: "ID_CARD", label: "ID Card (Carta d'Identita)" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
];

export function PersonalDetailsStep({
  form,
  disabled,
}: PersonalDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Personal Details</h3>
        <p className="text-sm text-muted-foreground">
          Please provide your personal information for account registration.
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Mario Rossi"
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
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthPlace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place of Birth</FormLabel>
              <FormControl>
                <Input placeholder="Roma" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personalTaxCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Code (Codice Fiscale) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="RSSMRA80A01H501U"
                  {...field}
                  disabled={disabled}
                  className="uppercase"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Contact Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="personalPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+39 xxx xxx xxxx"
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
            name="personalEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="mario@example.com"
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
            name="personalPecEmail"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>PEC Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="mario@pec.it"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>
                  Certified email address (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Residential Address */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Residential Address *</h4>
        <AddressFields
          form={form}
          prefix="residentialAddress"
          disabled={disabled}
        />
      </div>

      {/* Domicile Address (optional) */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">
          Domicile Address{" "}
          <span className="text-muted-foreground font-normal">
            (if different from residential)
          </span>
        </h4>
        <AddressFields
          form={form}
          prefix="domicileAddress"
          disabled={disabled}
        />
      </div>

      {/* ID Document */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Identity Document</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idDocumentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ID_DOCUMENT_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idDocumentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="AB1234567"
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
            name="idDocumentExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idDocumentIssuer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issuing Authority</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Comune di Roma"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
