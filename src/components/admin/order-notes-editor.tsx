"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type OrderNotesEditorProps = {
  orderId: string;
  initialNotes: string | null;
};

export function OrderNotesEditor({
  orderId,
  initialNotes,
}: OrderNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/orders/${orderId}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });

        if (!response.ok) {
          throw new Error("Failed to save notes");
        }

        toast.success("Notes saved");
        setHasChanges(false);
      } catch (error) {
        toast.error("Failed to save notes");
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, orderId, hasChanges]);

  const handleChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Internal Notes</CardTitle>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
          {hasChanges && !isSaving && (
            <div className="text-sm text-muted-foreground">Unsaved changes</div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Add internal notes about this order..."
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Changes are saved automatically
        </p>
      </CardContent>
    </Card>
  );
}
