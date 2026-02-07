"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { AgentOnboardingInput } from "@/lib/schemas/agent-onboarding";
import { AddressFields } from "../components/address-fields";

interface Props {
  form: UseFormReturn<AgentOnboardingInput>;
  disabled?: boolean;
}

export function PersonalInfoStep({ form, disabled }: Props) {
  const [showDomicile, setShowDomicile] = useState(
    !!form.getValues("domicileAddress")?.street
  );

  return (
    <div className="space-y-6">
      {/* Basic Personal Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Dati Personali
        </h3>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo *</FormLabel>
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

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data di Nascita *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Luogo di Nascita *</FormLabel>
                <FormControl>
                  <Input placeholder="Roma" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Fiscale *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="RSSMRA85M01H501Z"
                    {...field}
                    className="uppercase"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazionalità</FormLabel>
                <FormControl>
                  <Input placeholder="Italiana" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Contatti
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+39 333 1234567"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="mario@example.com"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="pecEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PEC Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="mario@pec.it (opzionale)"
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

      {/* Residential Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Indirizzo di Residenza *
        </h3>
        <AddressFields form={form} prefix="residentialAddress" disabled={disabled} />
      </div>

      {/* Domicile Address (optional) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-domicile"
            checked={showDomicile}
            onCheckedChange={(checked) => {
              setShowDomicile(checked === true);
              if (!checked) {
                form.setValue("domicileAddress", undefined);
              }
            }}
            disabled={disabled}
          />
          <label
            htmlFor="show-domicile"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Il domicilio è diverso dalla residenza
          </label>
        </div>
        {showDomicile && (
          <>
            <h3 className="text-sm font-medium text-muted-foreground">
              Indirizzo di Domicilio
            </h3>
            <AddressFields form={form} prefix="domicileAddress" disabled={disabled} />
          </>
        )}
      </div>
    </div>
  );
}
