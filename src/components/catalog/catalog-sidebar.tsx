"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Coffee, Wrench } from "lucide-react";
import { CategoryGroupType } from "@prisma/client";

type CategoryGroup = {
  id: string;
  name: CategoryGroupType;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type CatalogSidebarProps = {
  categoryGroups: CategoryGroup[];
  selectedGroup: CategoryGroupType;
  selectedCategory?: string;
  categories: Category[];
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
  categories,
}: CatalogSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateGroup = (group: CategoryGroupType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("group", group.toLowerCase());
    params.delete("category"); // Reset category when changing group
    router.push(`/dashboard/catalog?${params.toString()}`);
  };

  const updateCategory = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    router.push(`/dashboard/catalog?${params.toString()}`);
  };

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      {/* Category Groups */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Product Type</h3>
        <div className="space-y-1">
          {categoryGroups.map((group) => {
            const Icon = groupIcons[group.name];
            const isSelected = group.name === selectedGroup;

            return (
              <Button
                key={group.id}
                variant={isSelected ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => updateGroup(group.name)}
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
              >
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
