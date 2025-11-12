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
    set({ isLoading: true, error: null });
    try {
      await addToCart({ vendorProductId, quantity });
      // Items will be refreshed by server revalidation
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to add to cart",
      });
      throw error;
    }
  },

  update: async (itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      await updateCartItem({ itemId, quantity });
      // Update local state optimistically
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, qty: quantity } : item
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to update cart",
      });
      throw error;
    }
  },

  remove: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      await removeCartItem({ itemId });
      // Update local state optimistically
      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to remove from cart",
      });
      throw error;
    }
  },

  clear: async () => {
    set({ isLoading: true, error: null });
    try {
      await clearCart();
      set({ items: [], isLoading: false });
    } catch (error) {
      set({
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
