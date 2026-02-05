"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  submitClientOnboarding,
  type ClientOnboardingInput,
} from "@/actions/onboarding";
import {
  clientOnboardingSchema,
  getStepConfig,
  TOTAL_STEPS,
  type ClientType,
} from "@/lib/schemas/client-onboarding";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WizardProgress } from "./components/wizard-progress";
import { ClientTypeStep } from "./steps/client-type-step";
import { PersonalDetailsStep } from "./steps/personal-details-step";
import { CompanyDetailsStep } from "./steps/company-details-step";
import { BillingDocumentsStep } from "./steps/billing-documents-step";
import { OperationalStep } from "./steps/operational-step";
import { ConsentsStep } from "./steps/consents-step";

// Helper to check if a value is non-empty (handles strings, arrays, and objects)
function isNonEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    // Check if object has any non-empty values
    return Object.values(value).some((v) => isNonEmptyValue(v));
  }
  return Boolean(value);
}

// Fields to clear when switching from PRIVATE to BUSINESS
const PRIVATE_ONLY_FIELDS = [
  "fullName",
  "birthDate",
  "birthPlace",
  "personalTaxCode",
  "personalPhone",
  "personalEmail",
  "personalPecEmail",
  "residentialAddress",
  "domicileAddress",
  "idDocumentType",
  "idDocumentNumber",
  "idDocumentExpiry",
  "idDocumentIssuer",
] as const;

// Fields to clear when switching from BUSINESS to PRIVATE
const BUSINESS_ONLY_FIELDS = [
  "legalName",
  "tradeName",
  "vatNumber",
  "companyTaxCode",
  "sdiRecipientCode",
  "companyPecEmail",
  "registeredOfficeAddress",
  "operatingAddress",
  "adminContact",
  "operationalContact",
] as const;

export function ClientOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<ClientType | null>(
    null,
  );

  const form = useForm<ClientOnboardingInput>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      clientType: undefined as unknown as ClientType,
      // Personal Details
      fullName: "",
      birthDate: "",
      birthPlace: "",
      personalTaxCode: "",
      personalPhone: "",
      personalEmail: "",
      personalPecEmail: "",
      residentialAddress: undefined,
      domicileAddress: undefined,
      idDocumentType: undefined,
      idDocumentNumber: "",
      idDocumentExpiry: "",
      idDocumentIssuer: "",
      // Company Details
      legalName: "",
      tradeName: "",
      vatNumber: "",
      companyTaxCode: "",
      sdiRecipientCode: "",
      companyPecEmail: "",
      registeredOfficeAddress: undefined,
      operatingAddress: undefined,
      adminContact: undefined,
      operationalContact: undefined,
      // Billing
      invoicingNotes: "",
      documents: [],
      // Operational
      preferredContactHours: "",
      specialRequirements: "",
      operationalNotes: "",
      // Consents
      dataProcessingConsent: false as unknown as true,
      marketingConsent: false,
    },
    mode: "onTouched",
  });

  const clientType = form.watch("clientType");
  const isPrivate = clientType === "PRIVATE";
  const { fields: stepFields, labels: stepLabels } = getStepConfig(clientType);

  // Handle client type change with confirmation if fields have data
  const handleClientTypeChange = useCallback(
    (newType: ClientType) => {
      const currentType = form.getValues("clientType");

      // If same type or no previous type, just set it
      if (!currentType || currentType === newType) {
        form.setValue("clientType", newType);
        return;
      }

      // Check if the opposing section has data
      const fieldsToCheck =
        currentType === "PRIVATE" ? PRIVATE_ONLY_FIELDS : BUSINESS_ONLY_FIELDS;

      const hasData = fieldsToCheck.some((field) => {
        const value = form.getValues(field as keyof ClientOnboardingInput);
        return isNonEmptyValue(value);
      });

      if (hasData) {
        // Show confirmation dialog
        setPendingTypeChange(newType);
      } else {
        // No data to lose, just switch
        form.setValue("clientType", newType);
      }
    },
    [form],
  );

  // Confirm type change - clear irrelevant fields
  const confirmTypeChange = useCallback(() => {
    if (!pendingTypeChange) return;

    const currentType = form.getValues("clientType");
    const fieldsToClear =
      currentType === "PRIVATE" ? PRIVATE_ONLY_FIELDS : BUSINESS_ONLY_FIELDS;

    // Clear the fields
    fieldsToClear.forEach((field) => {
      const key = field as keyof ClientOnboardingInput;
      if (
        key.includes("Address") ||
        key === "adminContact" ||
        key === "operationalContact"
      ) {
        form.setValue(key, undefined as any);
      } else {
        form.setValue(key, "" as any);
      }
    });

    form.setValue("clientType", pendingTypeChange);
    setPendingTypeChange(null);
    // Reset completed steps and current step since structure changed
    setCompletedSteps(new Set([0]));
    setCurrentStep(1);
  }, [form, pendingTypeChange]);

  const cancelTypeChange = useCallback(() => {
    setPendingTypeChange(null);
  }, []);

  // Validate current step fields before proceeding
  const validateCurrentStep = async () => {
    const currentFields = stepFields[currentStep];
    const result = await form.trigger(currentFields as any);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: ClientOnboardingInput) => {
    setIsLoading(true);
    try {
      const result = await submitClientOnboarding(data);

      if (result.success) {
        toast.success("Registration submitted");
        // Refresh JWT so status=PENDING is in the token cookie
        const updatedSession = await update();
        // Verify session was updated before navigating
        if (updatedSession?.user?.status === "PENDING") {
          router.replace("/pending");
        } else {
          // Fallback: hard navigation if session didn't update
          window.location.assign("/pending");
        }
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    // Step 0 is always client type selection
    if (currentStep === 0) {
      return (
        <ClientTypeStep
          form={
            {
              ...form,
              setValue: (name: string, value: any) => {
                if (name === "clientType") {
                  handleClientTypeChange(value);
                } else {
                  form.setValue(name as any, value);
                }
              },
            } as any
          }
          disabled={isLoading}
        />
      );
    }

    // Step 1 depends on client type
    if (currentStep === 1) {
      return isPrivate ? (
        <PersonalDetailsStep form={form} disabled={isLoading} />
      ) : (
        <CompanyDetailsStep form={form} disabled={isLoading} />
      );
    }

    // Steps 2-4 are the same for both types
    if (currentStep === 2) {
      return (
        <BillingDocumentsStep
          form={form}
          disabled={isLoading}
          isPrivate={isPrivate}
        />
      );
    }

    if (currentStep === 3) {
      return <OperationalStep form={form} disabled={isLoading} />;
    }

    if (currentStep === 4) {
      return <ConsentsStep form={form} disabled={isLoading} />;
    }

    return null;
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const canProceedFromTypeStep = currentStep === 0 && clientType;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Client Registration</CardTitle>
              <WizardProgress
                currentStep={currentStep}
                completedSteps={completedSteps}
                labels={stepLabels}
              />
            </CardHeader>
            <CardContent className="pt-0">{renderStep()}</CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isFirstStep || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {isLastStep ? (
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Submitting..." : "Submit Registration"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    isLoading || (isFirstStep && !canProceedFromTypeStep)
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Confirmation dialog for type change */}
      <AlertDialog
        open={pendingTypeChange !== null}
        onOpenChange={(open) => !open && cancelTypeChange()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Client Type?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to{" "}
              {pendingTypeChange === "PRIVATE"
                ? "Private Individual"
                : "Business"}{" "}
              will clear the data you&apos;ve entered in the{" "}
              {clientType === "PRIVATE"
                ? "Personal Details"
                : "Company Details"}{" "}
              section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTypeChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmTypeChange}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
