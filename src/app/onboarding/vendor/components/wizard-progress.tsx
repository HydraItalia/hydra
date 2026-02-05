"use client";

import { STEP_LABELS } from "@/lib/schemas/vendor-onboarding";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentStep: number;
  completedSteps: Set<number>;
}

export function WizardProgress({
  currentStep,
  completedSteps,
}: WizardProgressProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEP_LABELS.map((label, i) => {
        const isActive = i === currentStep;
        const isCompleted = completedSteps.has(i);
        return (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-4 flex-shrink-0",
                  isCompleted || isActive ? "bg-primary" : "bg-muted",
                )}
              />
            )}
            <Badge
              variant={
                isActive ? "default" : isCompleted ? "secondary" : "outline"
              }
              className={cn(
                "text-xs whitespace-nowrap flex-shrink-0",
                isActive && "ring-2 ring-primary/20",
              )}
            >
              {i + 1}. {label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
