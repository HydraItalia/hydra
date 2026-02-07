"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  submitAgentOnboarding,
  type AgentOnboardingInput,
} from "@/actions/onboarding";
import {
  agentOnboardingSchema,
  STEP_FIELDS,
  STEP_LABELS,
  TOTAL_STEPS,
} from "@/lib/schemas/agent-onboarding";
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
import { ProfessionalInfoStep } from "./steps/professional-info-step";
import { FiscalInfoStep } from "./steps/fiscal-info-step";
import { BankingInfoStep } from "./steps/banking-info-step";
import { DocumentsStep } from "./steps/documents-step";
import { ConsentsStep } from "./steps/consents-step";

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentOnboardingFormProps {
  userId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DRAFT_KEY_PREFIX = "agent-onboarding-draft-";

function getDraftKey(userId: string) {
  return `${DRAFT_KEY_PREFIX}${userId}`;
}

/**
 * Expand STEP_FIELDS keys to include nested paths for RHF trigger().
 */
function getStepTriggerFields(stepIndex: number): string[] {
  const fields = STEP_FIELDS[stepIndex];
  const expanded: string[] = [];

  for (const field of fields) {
    if (field === "residentialAddress" || field === "domicileAddress") {
      expanded.push(
        `${field}.street`,
        `${field}.city`,
        `${field}.province`,
        `${field}.postalCode`,
        `${field}.country`
      );
    } else if (field === "documents") {
      expanded.push("documents");
    } else if (field === "coveredTerritories" || field === "sectors") {
      expanded.push(field);
    } else {
      expanded.push(field);
    }
  }

  return expanded;
}

function isNonEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some((v) => isNonEmptyValue(v));
  }
  return Boolean(value);
}

function hasFormData(data: Partial<AgentOnboardingInput>): boolean {
  const keysToCheck: (keyof AgentOnboardingInput)[] = [
    "fullName",
    "birthDate",
    "taxCode",
    "phone",
    "email",
    "residentialAddress",
    "vatNumber",
    "iban",
    "documents",
  ];
  return keysToCheck.some((key) => isNonEmptyValue(data[key]));
}

// ── Component ────────────────────────────────────────────────────────────────

export function AgentOnboardingForm({ userId }: AgentOnboardingFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Partial<AgentOnboardingInput> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<AgentOnboardingInput>({
    resolver: zodResolver(agentOnboardingSchema),
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
      phone: "",
      email: "",
      pecEmail: "",
      // Professional Info
      agentType: undefined,
      chamberRegistrationNumber: "",
      chamberRegistrationDate: "",
      chamberName: "",
      professionalAssociations: "",
      coveredTerritories: [],
      sectors: [],
      // Fiscal Info
      vatNumber: "",
      taxRegime: undefined,
      atecoCode: "",
      sdiRecipientCode: "",
      invoicingPecEmail: "",
      enasarcoNumber: "",
      enasarcoRegistrationDate: "",
      // Banking Info
      bankAccountHolder: "",
      iban: "",
      bankNameBranch: "",
      preferredPaymentMethod: "BANK_TRANSFER",
      commissionNotes: "",
      // Documents
      documents: [],
      // Consents
      dataProcessingConsent: undefined,
      operationalCommsConsent: false,
      commercialImageConsent: false,
    },
  });

  // ── Draft Persistence ───────────────────────────────────────────────────────

  const saveDraft = useCallback(
    (data: Partial<AgentOnboardingInput>) => {
      if (!hasFormData(data)) return;
      try {
        localStorage.setItem(getDraftKey(userId), JSON.stringify(data));
      } catch {
        // localStorage might be full or disabled
      }
    },
    [userId]
  );

  const loadDraft = useCallback((): Partial<AgentOnboardingInput> | null => {
    try {
      const saved = localStorage.getItem(getDraftKey(userId));
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Invalid JSON or localStorage disabled
    }
    return null;
  }, [userId]);

  const clearDraft = useCallback(() => {
    // Cancel any pending autosave to prevent re-saving after clear
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    try {
      localStorage.removeItem(getDraftKey(userId));
    } catch {
      // localStorage might be disabled
    }
  }, [userId]);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && hasFormData(draft)) {
      setPendingDraft(draft);
      setShowDraftModal(true);
    }
  }, [loadDraft]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft(data as Partial<AgentOnboardingInput>);
      }, 5000);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, saveDraft]);

  const handleResumeDraft = useCallback(() => {
    if (pendingDraft) {
      form.reset(pendingDraft as AgentOnboardingInput);
    }
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [form, pendingDraft]);

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

  const onSubmit = async (data: AgentOnboardingInput) => {
    setIsLoading(true);
    try {
      const result = await submitAgentOnboarding(data);

      if (result.success) {
        clearDraft();
        toast.success("Registrazione inviata");
        // Refresh JWT so status=PENDING is in the token cookie
        const updatedSession = await update();
        if (updatedSession?.user?.status === "PENDING") {
          router.replace("/pending");
        } else {
          window.location.assign("/pending");
        }
      } else {
        toast.error(result.error || "Invio fallito");
      }
    } catch {
      toast.error("Si è verificato un errore");
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
        return <ProfessionalInfoStep form={form} disabled={isLoading} />;
      case 2:
        return <FiscalInfoStep form={form} disabled={isLoading} />;
      case 3:
        return <BankingInfoStep form={form} disabled={isLoading} />;
      case 4:
        return <DocumentsStep form={form} disabled={isLoading} />;
      case 5:
        return <ConsentsStep form={form} disabled={isLoading} />;
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
              <CardTitle className="text-xl">Registrazione Agente</CardTitle>
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
                Indietro
              </Button>

              {isLastStep ? (
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Invio in corso..." : "Invia Registrazione"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext} disabled={isLoading}>
                  Avanti
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
            <AlertDialogTitle>Riprendere la bozza?</AlertDialogTitle>
            <AlertDialogDescription>
              Hai una registrazione non completata da una sessione precedente.
              Vuoi continuare da dove avevi lasciato?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Ricomincia
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeDraft}>
              Riprendi Bozza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
