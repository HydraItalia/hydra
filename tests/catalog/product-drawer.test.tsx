import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDrawer } from "@/components/catalog/product-drawer";
import { ProductUnit } from "@prisma/client";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the useMediaQuery hook
vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: vi.fn(() => true), // Default to desktop
}));

describe("ProductDrawer", () => {
  const mockProduct = {
    productId: "prod-1",
    productName: "Premium Olive Oil",
    unit: ProductUnit.L,
    categorySlug: "aceite",
    bestOffer: {
      vendorId: "vendor-1",
      vendorName: "Vendor A",
      priceCents: 1250,
      inStock: true,
      leadTimeDays: null,
    },
    offersCount: 3,
  };

  const mockOffers = [
    {
      vendorId: "vendor-1",
      vendorName: "Vendor A",
      priceCents: 1250,
      inStock: true,
      leadTimeDays: null,
    },
    {
      vendorId: "vendor-2",
      vendorName: "Vendor B",
      priceCents: 1300,
      inStock: true,
      leadTimeDays: null,
    },
    {
      vendorId: "vendor-3",
      vendorName: "Vendor C",
      priceCents: 1200,
      inStock: false,
      leadTimeDays: 7,
    },
  ];

  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product information", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    expect(screen.getByText("Premium Olive Oil")).toBeInTheDocument();
    expect(screen.getByText("aceite")).toBeInTheDocument();
    expect(screen.getByText("Compare prices from 3 vendors")).toBeInTheDocument();
  });

  it("displays vendor pricing table with all offers", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    expect(screen.getByText("Vendor A")).toBeInTheDocument();
    expect(screen.getByText("Vendor B")).toBeInTheDocument();
    expect(screen.getByText("Vendor C")).toBeInTheDocument();

    expect(screen.getByText("12,50 €")).toBeInTheDocument();
    expect(screen.getByText("13,00 €")).toBeInTheDocument();
    expect(screen.getByText("12,00 €")).toBeInTheDocument();
  });

  it("highlights the best offer row", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    // Best offer should have a star icon and badge
    const bestOfferBadge = screen.getByText("Best offer");
    expect(bestOfferBadge).toBeInTheDocument();

    // Check for star icon (aria-label)
    const starIcon = screen.getByLabelText("Best offer");
    expect(starIcon).toBeInTheDocument();
  });

  it("sorts offers with in-stock first, then by price", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    const rows = screen.getAllByRole("row");
    // Skip header row, check data rows
    const dataRows = rows.slice(1);

    // First should be Vendor A (in-stock, $12.50)
    expect(within(dataRows[0]).getByText("Vendor A")).toBeInTheDocument();

    // Second should be Vendor B (in-stock, $13.00)
    expect(within(dataRows[1]).getByText("Vendor B")).toBeInTheDocument();

    // Third should be Vendor C (out-of-stock, $12.00)
    expect(within(dataRows[2]).getByText("Vendor C")).toBeInTheDocument();
  });

  it("shows in-stock badges correctly", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    const inStockBadges = screen.getAllByText("In Stock");
    expect(inStockBadges).toHaveLength(2); // Vendor A and B
  });

  it("shows lead time for out-of-stock items", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    expect(screen.getByText("7d lead time")).toBeInTheDocument();
  });

  it("shows out-of-stock badge when no lead time available", () => {
    const offersWithNoLeadTime = [
      ...mockOffers.slice(0, 2),
      {
        vendorId: "vendor-3",
        vendorName: "Vendor C",
        priceCents: 1200,
        inStock: false,
        leadTimeDays: null,
      },
    ];

    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={offersWithNoLeadTime}
      />
    );

    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("disables add to cart button for out-of-stock items", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    const addToCartButtons = screen.getAllByText("Add to Cart");

    // First two should be enabled (in-stock)
    expect(addToCartButtons[0]).not.toBeDisabled();
    expect(addToCartButtons[1]).not.toBeDisabled();

    // Third should be disabled (out-of-stock)
    expect(addToCartButtons[2]).toBeDisabled();
  });

  it("has proper table structure", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    // Check table headers
    expect(screen.getByText("Vendor")).toBeInTheDocument();
    expect(screen.getByText("Price /", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Availability")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("calls onOpenChange when close is triggered", async () => {
    const user = userEvent.setup();

    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    // Try to find and click close button (X button in Dialog)
    // The close button is rendered by DialogPrimitive
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalled();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <ProductDrawer
        open={false}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    // When closed, Dialog/Drawer should not render content
    expect(screen.queryByText("Premium Olive Oil")).not.toBeInTheDocument();
  });

  it("has accessible dialog title and description", () => {
    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={mockProduct}
        allOffers={mockOffers}
      />
    );

    // Screen reader titles are present but visually hidden
    const title = screen.getByText(/Product Details: Premium Olive Oil/, {
      selector: ".sr-only",
    });
    expect(title).toBeInTheDocument();

    const description = screen.getByText(
      /Compare vendor prices and availability for Premium Olive Oil/,
      { selector: ".sr-only" }
    );
    expect(description).toBeInTheDocument();
  });

  it("renders singular vendor text when only one vendor", () => {
    const singleOffer = [mockOffers[0]];

    render(
      <ProductDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        product={{ ...mockProduct, offersCount: 1 }}
        allOffers={singleOffer}
      />
    );

    expect(screen.getByText("Compare prices from 1 vendor")).toBeInTheDocument();
  });
});
