"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Coffee, Wrench, Loader2 } from "lucide-react";
import { CategoryGroupType } from "@prisma/client";

type CategoryGroup = {
  id: string;
  name: CategoryGroupType;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  CategoryGroup: { name: CategoryGroupType };
};

type CatalogSidebarProps = {
  categoryGroups: CategoryGroup[];
  selectedGroup?: CategoryGroupType;
  selectedCategory?: string;
  allCategories: Category[];
};

const groupIcons = {
  FOOD: Package,
  BEVERAGE: Coffee,
  SERVICES: Wrench,
};

export function CatalogSidebar({
  categoryGroups,
  selectedGroup,
  selectedCategory,
  allCategories,
}: CatalogSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Filter categories by selected group
  const categories = selectedGroup
    ? allCategories.filter((cat) => cat.CategoryGroup.name === selectedGroup)
    : allCategories;

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
            <p className="text-sm text-muted-foreground">
              Loading products...
            </p>
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
            {categoryGroups.map((group) => {
              const Icon = groupIcons[group.name];
              const isSelected = group.name === selectedGroup;

              return (
                <Button
                  key={group.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => updateGroup(group.name)}
                  disabled={isPending}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {group.name}
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

              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => updateCategory(category.slug)}
                  disabled={isPending}
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
