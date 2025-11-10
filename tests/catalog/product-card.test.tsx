import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductUnit } from "@prisma/client";
import { vi, describe, it, expect } from "vitest";

describe("ProductCard", () => {
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

  it("renders product information correctly", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("Premium Olive Oil")).toBeInTheDocument();
    expect(screen.getByText("12,50 €")).toBeInTheDocument();
    expect(screen.getByText("/ L", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/from/)).toBeInTheDocument();
    expect(screen.getByText("Vendor A")).toBeInTheDocument();
  });

  it("shows in-stock badge when product is in stock", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("shows out-of-stock badge with lead time", () => {
    const outOfStockProduct = {
      ...mockProduct,
      bestOffer: {
        ...mockProduct.bestOffer!,
        inStock: false,
        leadTimeDays: 7,
      },
    };

    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText("7d lead time")).toBeInTheDocument();
  });

  it("shows out-of-stock badge without lead time", () => {
    const outOfStockProduct = {
      ...mockProduct,
      bestOffer: {
        ...mockProduct.bestOffer!,
        inStock: false,
        leadTimeDays: null,
      },
    };

    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("displays additional offers count", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("+2 more offers")).toBeInTheDocument();
  });

  it("displays singular offer text when only one additional offer", () => {
    const productWithTwoOffers = {
      ...mockProduct,
      offersCount: 2,
    };

    render(<ProductCard product={productWithTwoOffers} />);

    expect(screen.getByText("+1 more offer")).toBeInTheDocument();
  });

  it("does not show additional offers when only one offer exists", () => {
    const productWithOneOffer = {
      ...mockProduct,
      offersCount: 1,
    };

    render(<ProductCard product={productWithOneOffer} />);

    expect(screen.queryByText(/more offer/)).not.toBeInTheDocument();
  });

  it("shows no offers available message when no best offer", () => {
    const productWithoutOffers = {
      ...mockProduct,
      bestOffer: undefined,
      offersCount: 0,
    };

    render(<ProductCard product={productWithoutOffers} />);

    expect(screen.getByText("No offers available")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const card = screen.getByRole("button");
    await user.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Enter key is pressed", async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const card = screen.getByRole("button");
    card.focus();
    await user.keyboard("{Enter}");

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Space key is pressed", async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const card = screen.getByRole("button");
    card.focus();
    await user.keyboard(" ");

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("has correct accessibility attributes", () => {
    render(<ProductCard product={mockProduct} />);

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute(
      "aria-label",
      "View details for Premium Olive Oil"
    );
    expect(card).toHaveAttribute("tabIndex", "0");
  });

  it("applies hover styles", () => {
    render(<ProductCard product={mockProduct} />);

    const card = screen.getByRole("button");
    expect(card).toHaveClass("hover:shadow-lg");
    expect(card).toHaveClass("cursor-pointer");
  });
});
