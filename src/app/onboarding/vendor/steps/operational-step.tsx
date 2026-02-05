"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

export function OperationalStep({ form, disabled }: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emergencyContacts",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="openingHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Hours</FormLabel>
              <FormControl>
                <Input
                  placeholder="Mon-Fri 8:00-18:00"
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
          name="closingDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closing Days</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Sundays, Aug 15"
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
        name="warehouseAccess"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Warehouse / Loading Access</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Rear entrance, via gate code 1234"
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
      <p className="text-sm font-medium">Emergency Contacts</p>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end border rounded-md p-3"
        >
          <FormField
            control={form.control}
            name={`emergencyContacts.${index}.name`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name" {...f} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`emergencyContacts.${index}.phone`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+39 xxx" {...f} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove emergency contact ${index + 1}`}
            onClick={() => remove(index)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ name: "", phone: "", role: "" })}
        disabled={disabled}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Emergency Contact
      </Button>

      <Separator />
      <FormField
        control={form.control}
        name="operationalNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Operational Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any other operational details..."
                rows={3}
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
