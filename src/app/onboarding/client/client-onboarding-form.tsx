"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  submitClientOnboarding,
  type ClientOnboardingInput,
} from "@/actions/onboarding";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  businessName: z
    .string()
    .min(1, "Business or contact name is required")
    .max(255),
  region: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  contactPerson: z.string().max(255).optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  vendorName: z.string().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ClientOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      region: "",
      notes: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      vendorName: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const result = await submitClientOnboarding(
        data as ClientOnboardingInput,
      );

      if (result.success) {
        toast.success("Registration submitted");
        await update();
        router.push("/pending");
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business / Restaurant Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your business name"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Full name"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="business@example.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+39 xxx xxx xxxx"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Street address"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Lazio"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any additional information"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Vendor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Vendor name (optional)"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    If you have a vendor you&apos;d like to order from, enter
                    their name. A link request will be sent for approval.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Submitting..." : "Submit Registration"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
