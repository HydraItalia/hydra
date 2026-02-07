"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentOnboardingInput } from "@/lib/schemas/agent-onboarding";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENTS,
} from "@/lib/schemas/agent-onboarding";

interface Props {
  form: UseFormReturn<AgentOnboardingInput>;
  disabled?: boolean;
}

export function DocumentsStep({ form, disabled }: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
        <strong>Documenti richiesti:</strong>
        <ul className="mt-1 list-disc list-inside">
          {REQUIRED_DOCUMENTS.map((docType) => (
            <li key={docType}>{DOCUMENT_TYPE_LABELS[docType]}</li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-muted-foreground">
        Elenca i documenti che fornirai. Il caricamento dei file sarà
        disponibile dopo la registrazione.
      </p>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-md border p-3 space-y-3"
        >
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <FormField
              control={form.control}
              name={`documents.${index}.type`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Tipo Documento</FormLabel>
                  <Select
                    onValueChange={f.onChange}
                    value={f.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt} value={dt}>
                          {DOCUMENT_TYPE_LABELS[dt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`documents.${index}.label`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Etichetta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Es. Carta d'identità fronte/retro"
                      {...f}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Rimuovi documento ${index + 1}`}
              onClick={() => remove(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <FormField
            control={form.control}
            name={`documents.${index}.notes`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Note aggiuntive (opzionale)"
                    rows={2}
                    {...f}
                    value={f.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            type: "ID_DOCUMENT",
            label: "",
            fileName: "",
            notes: "",
          })
        }
        disabled={disabled}
      >
        <Plus className="mr-1 h-4 w-4" />
        Aggiungi Documento
      </Button>

      <FormField
        control={form.control}
        name="documents"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
