"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import {
  submitVendorOnboarding,
  type VendorOnboardingInput,
} from "@/actions/onboarding";
import {
  vendorOnboardingSchema,
  STEP_FIELDS,
} from "@/lib/schemas/vendor-onboarding";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { WizardProgress } from "./components/wizard-progress";
import { GeneralStep } from "./steps/general-step";
import { LegalTaxStep } from "./steps/legal-tax-step";
import { ContactsStep } from "./steps/contacts-step";
import { BankingStep } from "./steps/banking-step";
import { DocumentsStep } from "./steps/documents-step";
import { OperationalStep } from "./steps/operational-step";
import { ConsentsStep } from "./steps/consents-step";

const TOTAL_STEPS = STEP_FIELDS.length;

export function VendorOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const form = useForm<VendorOnboardingInput>({
    resolver: zodResolver(vendorOnboardingSchema),
    defaultValues: {
      legalName: "",
      tradeName: "",
      industry: "",
      description: "",
      foundedAt: "",
      vatNumber: "",
      taxCode: "",
      chamberOfCommerceRegistration: "",
      pecEmail: "",
      sdiRecipientCode: "",
      taxRegime: "",
      licenses: "",
      adminContact: { fullName: "", role: "", email: "", phone: "" },
      commercialContact: { fullName: "", role: "", email: "", phone: "" },
      bankAccountHolder: "",
      iban: "",
      bankNameAndBranch: "",
      invoicingNotes: "",
      documents: [],
      openingHours: "",
      closingDays: "",
      warehouseAccess: "",
      emergencyContacts: [],
      operationalNotes: "",
      dataProcessingConsent: undefined as never,
      marketingConsent: false,
      logoUsageConsent: false,
    },
  });

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep];
    const valid = await form.trigger(fields as any);
    if (!valid) return;

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = async (data: VendorOnboardingInput) => {
    setIsLoading(true);
    try {
      const result = await submitVendorOnboarding(data);
      if (result.success) {
        toast.success("Registration submitted");
        await update();
        router.push("/pending");
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-4">
          <WizardProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
        <Card>
          <CardContent className="pt-6">
            {currentStep === 0 && (
              <GeneralStep form={form} disabled={isLoading} />
            )}
            {currentStep === 1 && (
              <LegalTaxStep form={form} disabled={isLoading} />
            )}
            {currentStep === 2 && (
              <ContactsStep form={form} disabled={isLoading} />
            )}
            {currentStep === 3 && (
              <BankingStep form={form} disabled={isLoading} />
            )}
            {currentStep === 4 && (
              <DocumentsStep form={form} disabled={isLoading} />
            )}
            {currentStep === 5 && (
              <OperationalStep form={form} disabled={isLoading} />
            )}
            {currentStep === 6 && (
              <ConsentsStep form={form} disabled={isLoading} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            {isLastStep ? (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Submitting..." : "Submit Registration"}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={isLoading}>
                Next
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
