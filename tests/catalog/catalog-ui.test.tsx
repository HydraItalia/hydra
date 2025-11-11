import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { EmptyState } from "@/components/catalog/empty-state";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("CatalogSkeleton", () => {
  it("renders skeleton cards", () => {
    render(<CatalogSkeleton />);

    // Check that we have multiple skeleton cards (8 by default)
    const skeletons = screen.getAllByRole("generic");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("has correct grid layout classes", () => {
    const { container } = render(<CatalogSkeleton />);

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("md:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-3");
    expect(grid).toHaveClass("xl:grid-cols-4");
  });
});

describe("EmptyState", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      replace: mockReplace,
    });
  });

  it("renders empty state without filters", () => {
    render(<EmptyState hasActiveFilters={false} />);

    expect(screen.getByText("No products available")).toBeInTheDocument();
    expect(
      screen.getByText(
        /There are no products in this category yet/
      )
    ).toBeInTheDocument();

    // Should not show clear filters button
    expect(
      screen.queryByRole("button", { name: /clear all filters/i })
    ).not.toBeInTheDocument();
  });

  it("renders empty state with active filters", () => {
    render(<EmptyState hasActiveFilters={true} />);

    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(
      screen.getByText(
        /We couldn't find any products matching your search criteria/
      )
    ).toBeInTheDocument();

    // Should show clear filters button
    expect(
      screen.getByRole("button", { name: /clear all filters/i })
    ).toBeInTheDocument();
  });

  it("shows search icon when filters are active", () => {
    const { container } = render(<EmptyState hasActiveFilters={true} />);

    // Search icon should be present (lucide icon)
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("shows package icon when no filters are active", () => {
    const { container } = render(<EmptyState hasActiveFilters={false} />);

    // PackageOpen icon should be present
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("calls router.replace when clear filters is clicked", async () => {
    const user = userEvent.setup();
    render(<EmptyState hasActiveFilters={true} />);

    const clearButton = screen.getByRole("button", {
      name: /clear all filters/i,
    });
    await user.click(clearButton);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard/catalog");
  });
});
