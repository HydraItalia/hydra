"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Coffee, Wrench, Loader2 } from "lucide-react";
import { CategoryGroupType } from "@prisma/client";
import { getGroups } from "@/lib/taxonomy";
import type { GroupMeta } from "@/lib/taxonomy";

type CategoryGroup = {
  id: string;
  name: CategoryGroupType;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  _count?: { Product: number };
  CategoryGroup: { name: CategoryGroupType };
};

type CatalogSidebarProps = {
  categoryGroups: CategoryGroup[];
  selectedGroup?: CategoryGroupType;
  selectedCategory?: string;
  allCategories: Category[];
};

/** Map taxonomy icon hints to Lucide components */
const iconComponents = {
  package: Package,
  coffee: Coffee,
  wrench: Wrench,
} as const;

/** Get the Lucide icon component for a group via taxonomy metadata */
function getGroupIcon(meta: GroupMeta) {
  return iconComponents[meta.icon];
}

export function CatalogSidebar({
  categoryGroups,
  selectedGroup,
  selectedCategory,
  allCategories,
}: CatalogSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get group metadata from taxonomy (labels, icons, order)
  const groups = getGroups("IT");

  // Filter categories by selected group, hide empty ones
  const categories = (
    selectedGroup
      ? allCategories.filter((cat) => cat.CategoryGroup.name === selectedGroup)
      : allCategories
  ).filter((cat) => !cat._count || cat._count.Product > 0);

  const updateGroup = (group: CategoryGroupType | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (group) {
      params.set("group", group.toLowerCase());
    } else {
      params.delete("group");
    }
    params.delete("category"); // Reset category when changing group
    params.delete("page"); // Reset to page 1
    startTransition(() => {
      router.push(`/dashboard/catalog?${params.toString()}`);
    });
  };

  const updateCategory = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    params.delete("page"); // Reset to page 1
    startTransition(() => {
      router.push(`/dashboard/catalog?${params.toString()}`);
    });
  };

  return (
    <>
      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading products...</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border p-4 space-y-4">
        {/* Category Groups */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Product Type</h3>
          <div className="space-y-1">
            <Button
              variant={!selectedGroup ? "secondary" : "ghost"}
              className="w-full justify-start font-medium"
              onClick={() => updateGroup(null)}
              disabled={isPending}
            >
              All Products
            </Button>
            {groups
              .filter((meta) => categoryGroups.some((g) => g.name === meta.key))
              .map((meta) => {
                const Icon = getGroupIcon(meta);
                const isSelected = meta.key === selectedGroup;

                return (
                  <Button
                    key={meta.key}
                    variant={isSelected ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => updateGroup(meta.key)}
                    disabled={isPending}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {meta.label}
                  </Button>
                );
              })}
          </div>
        </div>

        <Separator />

        {/* Categories */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Categories</h3>
          <div className="space-y-1">
            <Button
              variant={!selectedCategory ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => updateCategory(null)}
              disabled={isPending}
            >
              All Categories
            </Button>
            {categories.map((category) => {
              const isSelected = category.slug === selectedCategory;
              const count = category._count?.Product;

              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => updateCategory(category.slug)}
                  disabled={isPending}
                >
                  <span>{category.name}</span>
                  {count !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
