import { create } from "zustand";
import {
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "@/data/cart";

export type CartItem = {
  id: string;
  vendorProductId: string;
  qty: number;
  unitPriceCents: number;
  productName: string;
  vendorName: string;
  productUnit: string;
  imageUrl?: string | null;
};

type CartStore = {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: CartItem[]) => void;
  add: (vendorProductId: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;

  // Computed
  totalCents: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),

  add: async (vendorProductId, quantity = 1) => {
    const previousItems = get().items;
    set({ isLoading: true, error: null });

    // Optimistic update: check if item exists
    const existingItem = previousItems.find(
      (item) => item.vendorProductId === vendorProductId
    );

    if (existingItem) {
      // Optimistically update quantity for existing items
      set((state) => ({
        items: state.items.map((item) =>
          item.vendorProductId === vendorProductId
            ? { ...item, qty: item.qty + quantity }
            : item
        ),
      }));
    }

    try {
      const updatedCart = await addToCart({ vendorProductId, quantity });
      // Sync with server response
      const items = updatedCart.items.map((item) => ({
        id: item.id,
        vendorProductId: item.vendorProductId,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        productName: item.vendorProduct.product.name,
        vendorName: item.vendorProduct.vendor.name,
        productUnit: item.vendorProduct.product.unit,
        imageUrl: item.vendorProduct.product.imageUrl,
      }));
      set({ items, isLoading: false });
    } catch (error) {
      // Rollback on error
      set({
        items: previousItems,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to add to cart",
      });
      throw error;
    }
  },

  update: async (itemId, quantity) => {
    const previousItems = get().items;
    set({ isLoading: true, error: null });

    // Optimistic update
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, qty: quantity } : item
      ),
    }));

    try {
      const updatedCart = await updateCartItem({ itemId, quantity });
      // Sync with server response
      const items = updatedCart.items.map((item) => ({
        id: item.id,
        vendorProductId: item.vendorProductId,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        productName: item.vendorProduct.product.name,
        vendorName: item.vendorProduct.vendor.name,
        productUnit: item.vendorProduct.product.unit,
        imageUrl: item.vendorProduct.product.imageUrl,
      }));
      set({ items, isLoading: false });
    } catch (error) {
      // Rollback on error
      set({
        items: previousItems,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to update cart",
      });
      throw error;
    }
  },

  remove: async (itemId) => {
    const previousItems = get().items;
    set({ isLoading: true, error: null });

    // Optimistic update
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));

    try {
      const updatedCart = await removeCartItem({ itemId });
      // Sync with server response
      const items = updatedCart.items.map((item) => ({
        id: item.id,
        vendorProductId: item.vendorProductId,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        productName: item.vendorProduct.product.name,
        vendorName: item.vendorProduct.vendor.name,
        productUnit: item.vendorProduct.product.unit,
        imageUrl: item.vendorProduct.product.imageUrl,
      }));
      set({ items, isLoading: false });
    } catch (error) {
      // Rollback on error
      set({
        items: previousItems,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to remove from cart",
      });
      throw error;
    }
  },

  clear: async () => {
    const previousItems = get().items;
    set({ isLoading: true, error: null });

    // Optimistic update
    set({ items: [] });

    try {
      const updatedCart = await clearCart();
      // Sync with server response (should be empty)
      const items = updatedCart.items.map((item) => ({
        id: item.id,
        vendorProductId: item.vendorProductId,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        productName: item.vendorProduct.product.name,
        vendorName: item.vendorProduct.vendor.name,
        productUnit: item.vendorProduct.product.unit,
        imageUrl: item.vendorProduct.product.imageUrl,
      }));
      set({ items, isLoading: false });
    } catch (error) {
      // Rollback on error
      set({
        items: previousItems,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to clear cart",
      });
      throw error;
    }
  },

  totalCents: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.qty * item.unitPriceCents, 0);
  },

  itemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.qty, 0);
  },
}));
