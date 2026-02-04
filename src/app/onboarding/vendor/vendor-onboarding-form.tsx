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
  submitVendorOnboarding,
  type VendorOnboardingInput,
} from "@/actions/onboarding";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  businessName: z.string().min(1, "Business name is required").max(255),
  contactEmail: z
    .string()
    .email("Invalid email")
    .or(z.literal(""))
    .optional(),
  contactPhone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  businessHours: z.string().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

export function VendorOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      region: "",
      businessHours: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const result = await submitVendorOnboarding(
        data as VendorOnboardingInput,
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
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your company name"
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
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
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
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
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
              name="businessHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Hours</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Mon-Fri 8:00-18:00"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
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
