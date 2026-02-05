"use client";

import { UseFormReturn } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { ContactFields } from "../components/contact-fields";
import type { VendorOnboardingInput } from "@/lib/schemas/vendor-onboarding";

interface Props {
  form: UseFormReturn<VendorOnboardingInput>;
  disabled?: boolean;
}

export function ContactsStep({ form, disabled }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Administrative Contact *</p>
        <ContactFields form={form} prefix="adminContact" disabled={disabled} />
      </div>

      <Separator />

      <div>
        <p className="text-sm font-medium mb-2">Commercial Contact *</p>
        <ContactFields form={form} prefix="commercialContact" disabled={disabled} />
      </div>

      <Separator />

      <div>
        <p className="text-sm font-medium mb-2">
          Technical Contact <span className="text-muted-foreground">(optional)</span>
        </p>
        <ContactFields
          form={form}
          prefix="technicalContact"
          showRole={false}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
