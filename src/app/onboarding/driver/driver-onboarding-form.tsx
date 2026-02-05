"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  submitDriverOnboarding,
  type DriverOnboardingInput,
} from "@/actions/onboarding";
import {
  driverOnboardingSchema,
  STEP_FIELDS,
  STEP_LABELS,
  TOTAL_STEPS,
} from "@/lib/schemas/driver-onboarding";
import type { ApprovedVendorOption } from "@/data/vendors";
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
import { PersonalInfoStep } from "./steps/personal-info-step";
import { IdentityDocumentStep } from "./steps/identity-document-step";
import { LicensesStep } from "./steps/licenses-step";
import { DocumentsStep } from "./steps/documents-step";
import { CompanyConsentsStep } from "./steps/company-consents-step";

// ── Types ────────────────────────────────────────────────────────────────────

interface DriverOnboardingFormProps {
  userId: string;
  inviteData: {
    vendorId: string;
    vendorName: string;
    inviteToken: string;
  } | null;
  approvedVendors: ApprovedVendorOption[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DRAFT_KEY_PREFIX = "driver-onboarding-draft-";

function getDraftKey(userId: string) {
  return `${DRAFT_KEY_PREFIX}${userId}`;
}

/**
 * Expand STEP_FIELDS keys to include nested paths for RHF trigger().
 * e.g., "residentialAddress" -> ["residentialAddress.street", "residentialAddress.city", ...]
 */
function getStepTriggerFields(stepIndex: number): string[] {
  const fields = STEP_FIELDS[stepIndex];
  const expanded: string[] = [];

  for (const field of fields) {
    if (field === "residentialAddress" || field === "domicileAddress") {
      // Expand address fields
      expanded.push(
        `${field}.street`,
        `${field}.city`,
        `${field}.province`,
        `${field}.postalCode`,
        `${field}.country`
      );
    } else if (field === "licenses") {
      // licenses is an array - trigger the whole array
      expanded.push("licenses");
    } else if (field === "documents") {
      // documents is an array - trigger the whole array
      expanded.push("documents");
    } else {
      expanded.push(field);
    }
  }

  return expanded;
}

// Check if a value is non-empty
function isNonEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some((v) => isNonEmptyValue(v));
  }
  return Boolean(value);
}

// Check if form has any data worth saving
function hasFormData(data: Partial<DriverOnboardingInput>): boolean {
  const keysToCheck: (keyof DriverOnboardingInput)[] = [
    "fullName",
    "birthDate",
    "taxCode",
    "phone",
    "email",
    "residentialAddress",
    "licenses",
    "documents",
  ];
  return keysToCheck.some((key) => isNonEmptyValue(data[key]));
}

// ── Component ────────────────────────────────────────────────────────────────

export function DriverOnboardingForm({
  userId,
  inviteData,
  approvedVendors,
}: DriverOnboardingFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Partial<DriverOnboardingInput> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<DriverOnboardingInput>({
    resolver: zodResolver(driverOnboardingSchema),
    defaultValues: {
      // Personal Info
      fullName: "",
      birthDate: "",
      birthPlace: "",
      taxCode: "",
      nationality: "Italiana",
      residentialAddress: {
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "Italia",
      },
      domicileAddress: undefined,
      phone: "",
      email: "",
      pecEmail: "",
      // Identity Document
      idDocumentType: undefined as unknown as "ID_CARD" | "PASSPORT" | "DRIVING_LICENSE",
      idDocumentNumber: "",
      idDocumentExpiry: "",
      idDocumentIssuer: "",
      // Licenses
      licenses: [],
      // Documents
      documents: [],
      // Company & Consents
      vendorId: inviteData?.vendorId ?? "",
      inviteToken: inviteData?.inviteToken,
      dataProcessingConsent: false as unknown as true,
      operationalCommsConsent: false,
      geolocationConsent: false,
      imageUsageConsent: false,
    },
    mode: "onTouched",
  });

  // ── Draft Persistence ────────────────────────────────────────────────────────

  // Check for existing draft on mount
  useEffect(() => {
    const draftKey = getDraftKey(userId);
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as Partial<DriverOnboardingInput>;
        if (hasFormData(parsed)) {
          setPendingDraft(parsed);
          setShowDraftModal(true);
        }
      } catch {
        // Invalid draft, remove it
        localStorage.removeItem(draftKey);
      }
    }
  }, [userId]);

  // Debounced save to localStorage
  const saveDraft = useCallback(
    (data: Partial<DriverOnboardingInput>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (hasFormData(data)) {
          localStorage.setItem(getDraftKey(userId), JSON.stringify(data));
        }
      }, 1000); // 1 second debounce
    },
    [userId]
  );

  // Watch form and save draft on changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      saveDraft(data as Partial<DriverOnboardingInput>);
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  // Clear draft on success
  const clearDraft = useCallback(() => {
    localStorage.removeItem(getDraftKey(userId));
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, [userId]);

  // Resume draft handler
  const handleResumeDraft = useCallback(() => {
    if (pendingDraft) {
      // Reset form with draft data, preserving invite data if present
      form.reset({
        ...pendingDraft,
        vendorId: inviteData?.vendorId ?? pendingDraft.vendorId ?? "",
        inviteToken: inviteData?.inviteToken ?? pendingDraft.inviteToken,
      } as DriverOnboardingInput);
    }
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [form, pendingDraft, inviteData]);

  // Discard draft handler
  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [clearDraft]);

  // ── Step Navigation ──────────────────────────────────────────────────────────

  const validateCurrentStep = async () => {
    const fieldsToTrigger = getStepTriggerFields(currentStep);
    const result = await form.trigger(fieldsToTrigger as any);
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

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (data: DriverOnboardingInput) => {
    setIsLoading(true);
    try {
      const result = await submitDriverOnboarding(data);

      if (result.success) {
        clearDraft();
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

  // ── Render ───────────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep form={form} disabled={isLoading} />;
      case 1:
        return <IdentityDocumentStep form={form} disabled={isLoading} />;
      case 2:
        return <LicensesStep form={form} disabled={isLoading} />;
      case 3:
        return <DocumentsStep form={form} disabled={isLoading} />;
      case 4:
        return (
          <CompanyConsentsStep
            form={form}
            disabled={isLoading}
            inviteData={inviteData}
            approvedVendors={approvedVendors}
          />
        );
      default:
        return null;
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Driver Registration</CardTitle>
              <WizardProgress
                currentStep={currentStep}
                completedSteps={completedSteps}
                labels={STEP_LABELS}
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
                <Button type="button" onClick={handleNext} disabled={isLoading}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Resume draft modal */}
      <AlertDialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Previous Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an unfinished registration from a previous session. Would
              you like to continue where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeDraft}>
              Resume Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
