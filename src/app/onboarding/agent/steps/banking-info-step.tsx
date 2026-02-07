"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
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
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/schemas/agent-onboarding";

interface Props {
  form: UseFormReturn<AgentOnboardingInput>;
  disabled?: boolean;
}

export function BankingInfoStep({ form, disabled }: Props) {
  return (
    <div className="space-y-6">
      {/* Account Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Coordinate Bancarie
        </h3>
        <FormField
          control={form.control}
          name="bankAccountHolder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intestatario Conto *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Mario Rossi"
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
          name="iban"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IBAN *</FormLabel>
              <FormControl>
                <Input
                  placeholder="IT60X0542811101000000123456"
                  {...field}
                  className="uppercase"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value.toUpperCase().replace(/\s/g, "")
                    )
                  }
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bankNameBranch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banca e Filiale *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Intesa Sanpaolo - Roma Termini"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Payment Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Preferenze di Pagamento
        </h3>
        <FormField
          control={form.control}
          name="preferredPaymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metodo di Pagamento Preferito</FormLabel>
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
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
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
          name="commissionNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note su Commissioni</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Eventuali note su condizioni provvigionali, termini di pagamento, ecc. (opzionale)"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
