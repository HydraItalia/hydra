"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TemplateSuggestion } from "@/lib/import/catalog-csv";

interface TemplateSuggestionBannerProps {
  suggestion: TemplateSuggestion | null;
  loading: boolean;
  onApply: (templateId: string) => void;
  onDismiss: () => void;
}

export function TemplateSuggestionBanner({
  suggestion,
  loading,
  onApply,
  onDismiss,
}: TemplateSuggestionBannerProps) {
  if (loading) {
    return <Skeleton className="h-14 w-full rounded-lg" />;
  }

  if (!suggestion) return null;

  const scorePercent = Math.round(suggestion.score * 100);

  if (suggestion.autoApply) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Template <strong>&ldquo;{suggestion.templateName}&rdquo;</strong>{" "}
            applied ({scorePercent}% match)
          </span>
          <span className="flex items-center gap-2 ml-4 shrink-0">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-green-700 dark:text-green-300"
              onClick={() => onApply(suggestion.templateId)}
            >
              Change
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          Template <strong>&ldquo;{suggestion.templateName}&rdquo;</strong>{" "}
          might match ({scorePercent}% match)
        </span>
        <span className="flex items-center gap-2 ml-4 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => onApply(suggestion.templateId)}
          >
            Apply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </span>
      </AlertDescription>
    </Alert>
  );
}
