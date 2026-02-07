"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AGENT_TYPES,
  AGENT_TYPE_LABELS,
  ITALIAN_REGIONS,
  BUSINESS_SECTORS,
} from "@/lib/schemas/agent-onboarding";

interface Props {
  form: UseFormReturn<AgentOnboardingInput>;
  disabled?: boolean;
}

export function ProfessionalInfoStep({ form, disabled }: Props) {
  const coveredTerritories = form.watch("coveredTerritories") || [];
  const sectors = form.watch("sectors") || [];

  const toggleTerritory = (region: string) => {
    const current = form.getValues("coveredTerritories") || [];
    if (current.includes(region as (typeof ITALIAN_REGIONS)[number])) {
      form.setValue(
        "coveredTerritories",
        current.filter((r) => r !== region) as typeof current,
        { shouldValidate: true }
      );
    } else {
      form.setValue(
        "coveredTerritories",
        [...current, region] as typeof current,
        { shouldValidate: true }
      );
    }
  };

  const toggleSector = (sector: string) => {
    const current = form.getValues("sectors") || [];
    if (current.includes(sector as (typeof BUSINESS_SECTORS)[number])) {
      form.setValue(
        "sectors",
        current.filter((s) => s !== sector) as typeof current,
        { shouldValidate: true }
      );
    } else {
      form.setValue("sectors", [...current, sector] as typeof current, {
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Type */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Tipo di Agente
        </h3>
        <FormField
          control={form.control}
          name="agentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Agente *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AGENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {AGENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Chamber of Commerce Registration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Iscrizione Camera di Commercio (CCIAA)
        </h3>
        <FormField
          control={form.control}
          name="chamberName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Camera di Commercio *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Camera di Commercio di Milano"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="chamberRegistrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero Iscrizione *</FormLabel>
                <FormControl>
                  <Input placeholder="REA MI-12345" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chamberRegistrationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Iscrizione *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="professionalAssociations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associazioni Professionali</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Es. FNAARC, USARCI... (opzionale)"
                  rows={2}
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

      {/* Covered Territories */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Zone Coperte *
        </h3>
        <FormField
          control={form.control}
          name="coveredTerritories"
          render={() => (
            <FormItem>
              <FormDescription>
                Seleziona le regioni in cui operi
              </FormDescription>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {ITALIAN_REGIONS.map((region) => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={`territory-${region}`}
                      checked={coveredTerritories.includes(region)}
                      onCheckedChange={() => toggleTerritory(region)}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`territory-${region}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {region}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Business Sectors */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Settori Merceologici *
        </h3>
        <FormField
          control={form.control}
          name="sectors"
          render={() => (
            <FormItem>
              <FormDescription>
                Seleziona i settori in cui operi
              </FormDescription>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {BUSINESS_SECTORS.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={sectors.includes(sector)}
                      onCheckedChange={() => toggleSector(sector)}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`sector-${sector}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {sector}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
