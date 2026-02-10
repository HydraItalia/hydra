"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateImportRow,
  getCanonicalCategories,
  saveVendorCategoryMapping,
} from "@/actions/vendor-import";
import type { BatchRow } from "@/lib/import/batch-service";

const UNIT_OPTIONS = ["KG", "L", "PIECE", "BOX", "SERVICE"] as const;

const editRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.enum(UNIT_OPTIONS),
  priceEuros: z.coerce.number().min(0, "Price must be non-negative"),
  inStock: z.boolean(),
  productCode: z.string().optional(),
  saveMapping: z.boolean().optional(),
});

type EditRowFormValues = z.infer<typeof editRowSchema>;

type CanonicalCategoryItem = { slug: string; name: string; group: string };

interface EditRowDialogProps {
  batchId: string;
  row: BatchRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRowUpdated: (
    rowId: string,
    status: string,
    errors: string[],
    normalizedData: Record<string, unknown>,
    batchErrorCount: number,
  ) => void;
}

/** Parse suggestion names from an UNMAPPED_CATEGORY error message */
function parseSuggestions(error: string): string[] {
  const match = error.match(/Did you mean:\s*(.+)\?$/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function EditRowDialog({
  batchId,
  row,
  open,
  onOpenChange,
  onRowUpdated,
}: EditRowDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canonicalCategories, setCanonicalCategories] = useState<
    CanonicalCategoryItem[]
  >([]);
  const normalized = row.normalizedData as Record<string, any> | null;
  const errors = Array.isArray(row.errors) ? (row.errors as string[]) : [];

  // Check if there's an UNMAPPED_CATEGORY error
  const unmappedError = errors.find((e) => e.startsWith("UNMAPPED_CATEGORY:"));
  const suggestions = unmappedError ? parseSuggestions(unmappedError) : [];
  const rawCategory = normalized?.category || "";

  // Load canonical categories on mount
  useEffect(() => {
    getCanonicalCategories().then((res) => {
      if (res.success && res.data) {
        setCanonicalCategories(res.data);
      }
    });
  }, []);

  // Group categories by group type for the select dropdown
  const groupedCategories = useMemo(() => {
    const groups: Record<string, CanonicalCategoryItem[]> = {};
    for (const cat of canonicalCategories) {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    }
    return groups;
  }, [canonicalCategories]);

  const form = useForm<EditRowFormValues>({
    resolver: zodResolver(editRowSchema),
    defaultValues: {
      name: normalized?.name || "",
      category: normalized?.category || "",
      unit: (normalized?.unit as (typeof UNIT_OPTIONS)[number]) || "PIECE",
      priceEuros:
        normalized?.priceCents != null ? normalized.priceCents / 100 : 0,
      inStock: normalized?.inStock ?? false,
      productCode: normalized?.productCode || "",
      saveMapping: false,
    },
  });

  const onSubmit = async (values: EditRowFormValues) => {
    setIsSubmitting(true);
    try {
      // If "save mapping" is checked and user selected a canonical category,
      // persist the mapping so future imports auto-resolve
      if (
        values.saveMapping &&
        rawCategory &&
        values.category !== rawCategory
      ) {
        // Find the canonical slug for the selected category name
        const selected = canonicalCategories.find(
          (c) => c.name === values.category,
        );
        if (selected) {
          const mapResult = await saveVendorCategoryMapping(
            rawCategory,
            selected.slug,
          );
          if (!mapResult.success) {
            toast.error(`Mapping save failed: ${mapResult.error}`);
          }
        }
      }

      const result = await updateImportRow(batchId, row.id, {
        name: values.name,
        category: values.category,
        unit: values.unit,
        priceCents: Math.round(values.priceEuros * 100),
        inStock: values.inStock,
        productCode: values.productCode || "",
      });

      if (result.success && result.data) {
        onRowUpdated(
          row.id,
          result.data.status,
          result.data.errors,
          result.data.normalizedData as unknown as Record<string, unknown>,
          result.data.batchErrorCount,
        );
        if (result.data.status === "VALID") {
          toast.success(`Row ${row.rowIndex + 1} is now valid`);
        } else {
          toast.warning(`Row ${row.rowIndex + 1} still has errors`);
        }
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update row");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Row {row.rowIndex + 1}</DialogTitle>
          <DialogDescription>
            Fix the errors and save to re-validate this row.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            <p className="font-medium mb-1">Current errors:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground self-center">
              Suggestions:
            </span>
            {suggestions.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => form.setValue("category", name)}
              >
                {name}
              </Badge>
            ))}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(groupedCategories).map(
                        ([group, cats]) => (
                          <SelectGroup key={group}>
                            <SelectLabel>{group}</SelectLabel>
                            {cats.map((cat) => (
                              <SelectItem key={cat.slug} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
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
              name="priceEuros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (EUR)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inStock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">In Stock</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {unmappedError && (
              <FormField
                control={form.control}
                name="saveMapping"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5 leading-none">
                      <FormLabel className="font-normal">
                        Save mapping for &ldquo;{rawCategory}&rdquo;
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Future imports with this category will auto-resolve
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save & Re-validate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
