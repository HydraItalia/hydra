import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe("CatalogFilters", () => {
  const mockReplace = vi.fn();
  const mockSearchParams = new URLSearchParams();

  const defaultProps = {
    vendors: [
      { label: "All vendors", value: "all" },
      { label: "Vendor A", value: "vendor-a" },
      { label: "Vendor B", value: "vendor-b" },
    ],
    initial: {
      group: "food" as const,
      category: undefined,
      vendorId: undefined,
      q: undefined,
      inStock: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset search params by creating a new instance
    Object.keys(mockSearchParams).forEach((key) =>
      mockSearchParams.delete(key)
    );
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      replace: mockReplace,
    });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      mockSearchParams
    );
  });

  it("renders with initial params", () => {
    render(<CatalogFilters {...defaultProps} />);

    expect(screen.getByLabelText("Search products")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by vendor")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Show in-stock products only")
    ).toBeInTheDocument();
  });

  it("updates URL on search after debounce", async () => {
    const user = userEvent.setup();
    render(<CatalogFilters {...defaultProps} />);

    const searchInput = screen.getByLabelText("Search products");
    await user.type(searchInput, "pasta");

    // Should not update immediately
    expect(mockReplace).not.toHaveBeenCalled();

    // Should update after debounce (~300ms)
    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining("q=pasta")
        );
      },
      { timeout: 500 }
    );
  });

  it("clears search param when search is cleared", async () => {
    const user = userEvent.setup();
    const propsWithSearch = {
      ...defaultProps,
      initial: { ...defaultProps.initial, q: "pasta" },
    };

    render(<CatalogFilters {...propsWithSearch} />);

    const searchInput = screen.getByLabelText("Search products");
    await user.clear(searchInput);

    await waitFor(
      () => {
        const lastCall =
          mockReplace.mock.calls[mockReplace.mock.calls.length - 1];
        expect(lastCall[0]).not.toContain("q=");
      },
      { timeout: 500 }
    );
  });

  it("toggles in-stock filter and updates URL", async () => {
    const user = userEvent.setup();
    render(<CatalogFilters {...defaultProps} />);

    const checkbox = screen.getByLabelText("Show in-stock products only");
    await user.click(checkbox);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("inStock=1")
    );
  });

  it("removes inStock param when unchecked", async () => {
    const user = userEvent.setup();
    const propsWithInStock = {
      ...defaultProps,
      initial: { ...defaultProps.initial, inStock: true },
    };

    render(<CatalogFilters {...propsWithInStock} />);

    const checkbox = screen.getByLabelText("Show in-stock products only");
    await user.click(checkbox);

    const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1];
    expect(lastCall[0]).not.toContain("inStock");
  });

  // Skipping vendor select test due to JSDOM compatibility with Radix UI Select
  it.skip("sets vendorId when vendor is selected", async () => {
    const user = userEvent.setup();
    render(<CatalogFilters {...defaultProps} />);

    const vendorSelect = screen.getByLabelText("Filter by vendor");
    await user.click(vendorSelect);

    const vendorOption = screen.getByText("Vendor A");
    await user.click(vendorOption);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("vendorId=vendor-a")
    );
  });

  it("shows active filter badges", () => {
    const propsWithFilters = {
      ...defaultProps,
      initial: {
        group: "food" as const,
        category: undefined,
        vendorId: "vendor-a",
        q: "pasta",
        inStock: true,
      },
    };

    render(<CatalogFilters {...propsWithFilters} />);

    expect(screen.getByText(/Search: pasta/)).toBeInTheDocument();
    expect(screen.getByText(/Vendor: Vendor A/)).toBeInTheDocument();
    expect(screen.getByText("In stock only")).toBeInTheDocument();
  });

  it('clears all filters when "Clear all" is clicked', async () => {
    const user = userEvent.setup();
    const propsWithFilters = {
      ...defaultProps,
      initial: {
        group: "food" as const,
        category: undefined,
        vendorId: "vendor-a",
        q: "pasta",
        inStock: true,
      },
    };

    render(<CatalogFilters {...propsWithFilters} />);

    const clearAllButton = screen.getByText("Clear all");
    await user.click(clearAllButton);

    const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1];
    expect(lastCall[0]).not.toContain("q=");
    expect(lastCall[0]).not.toContain("vendorId=");
    expect(lastCall[0]).not.toContain("inStock=");
  });
});
