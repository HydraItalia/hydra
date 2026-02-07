"use client";

import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { AgentOnboardingInput } from "@/lib/schemas/agent-onboarding";

interface Props {
  form: UseFormReturn<AgentOnboardingInput>;
  disabled?: boolean;
}

export function ConsentsStep({ form, disabled }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Prima di procedere, conferma i seguenti consensi.
      </p>

      <FormField
        control={form.control}
        name="dataProcessingConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Consenso al Trattamento dei Dati *</FormLabel>
              <p className="text-sm text-muted-foreground">
                Acconsento al trattamento dei dati personali forniti in questo
                modulo ai sensi del Regolamento UE 2016/679 (GDPR) e della
                normativa italiana vigente in materia di protezione dei dati
                personali.
              </p>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="operationalCommsConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Comunicazioni Operative</FormLabel>
              <p className="text-sm text-muted-foreground">
                Acconsento a ricevere comunicazioni operative relative
                all&apos;attività di agente (notifiche ordini, aggiornamenti
                catalogo, comunicazioni amministrative).
              </p>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="commercialImageConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Utilizzo Immagine Commerciale</FormLabel>
              <p className="text-sm text-muted-foreground">
                Autorizzo l&apos;utilizzo del mio nome e/o immagine per
                materiale promozionale e comunicazioni commerciali della
                piattaforma Hydra.
              </p>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
