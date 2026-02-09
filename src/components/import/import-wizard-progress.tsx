"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEPS = ["Upload", "Preview", "Validate", "Commit", "Done"];

interface ImportWizardProgressProps {
  currentStep: number;
}

export function ImportWizardProgress({
  currentStep,
}: ImportWizardProgressProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((label, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
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
