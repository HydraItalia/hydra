"use client";

import { UseFormReturn } from "react-hook-form";
import { Building2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Card, CardContent } from "@/components/ui/card";
import type { DriverOnboardingInput } from "@/lib/schemas/driver-onboarding";
import type { ApprovedVendorOption } from "@/data/vendors";

interface Props {
  form: UseFormReturn<DriverOnboardingInput>;
  disabled?: boolean;
  inviteData: {
    vendorId: string;
    vendorName: string;
    inviteToken: string;
  } | null;
  approvedVendors: ApprovedVendorOption[];
}

export function CompanyConsentsStep({
  form,
  disabled,
  inviteData,
  approvedVendors,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Company Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Company Association
        </h3>

        {inviteData ? (
          // Read-only card when coming from invite
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{inviteData.vendorName}</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ve been invited to join this company
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Dropdown when no invite
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Company *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a company..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {approvedVendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.tradeName || vendor.name}
                        {vendor.tradeName &&
                          vendor.name !== vendor.tradeName && (
                            <span className="text-muted-foreground ml-1">
                              ({vendor.name})
                            </span>
                          )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Consents */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Consents & Authorizations
        </h3>

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
                  I consent to the processing of my personal data in accordance
                  with applicable data protection regulations (GDPR).
                </p>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="operationalCommsConsent"
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
                <FormLabel>Operational Communications</FormLabel>
                <p className="text-sm text-muted-foreground">
                  I agree to receive operational communications via SMS, email,
                  or push notifications regarding deliveries and service
                  updates.
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="geolocationConsent"
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
                <FormLabel>Geolocation Tracking</FormLabel>
                <p className="text-sm text-muted-foreground">
                  I consent to geolocation tracking during active deliveries for
                  route optimization and delivery confirmation.
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUsageConsent"
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
                <FormLabel>Image Usage</FormLabel>
                <p className="text-sm text-muted-foreground">
                  I authorize the use of my profile photo on the Hydra platform
                  for identification purposes.
                </p>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
