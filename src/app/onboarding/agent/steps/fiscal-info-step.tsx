"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentOnboardingInput } from "@/lib/schemas/agent-onboarding";
import { TAX_REGIMES, TAX_REGIME_LABELS } from "@/lib/schemas/agent-onboarding";

interface Props {
  form: UseFormReturn<AgentOnboardingInput>;
  disabled?: boolean;
}

export function FiscalInfoStep({ form, disabled }: Props) {
  return (
    <div className="space-y-6">
      {/* VAT & Tax Regime */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Partita IVA e Regime Fiscale
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="vatNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partita IVA *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="IT12345678901"
                    {...field}
                    className="uppercase"
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>11 cifre (con o senza IT)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxRegime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regime Fiscale *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TAX_REGIMES.map((regime) => (
                      <SelectItem key={regime} value={regime}>
                        {TAX_REGIME_LABELS[regime]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="atecoCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice ATECO *</FormLabel>
              <FormControl>
                <Input
                  placeholder="46.19.01"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Codice attività economica (es. 46.19.01 - Agenti di commercio)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Electronic Invoicing */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Fatturazione Elettronica
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="sdiRecipientCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice SDI *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0000000"
                    {...field}
                    className="uppercase"
                    maxLength={7}
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>7 caratteri alfanumerici</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoicingPecEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PEC per Fatturazione *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="fatture@pec.it"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* ENASARCO */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Dati ENASARCO
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="enasarcoNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero ENASARCO *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="12345678"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="enasarcoRegistrationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Iscrizione ENASARCO *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
