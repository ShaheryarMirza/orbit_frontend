import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Product {
  id: number;
  category_id?: number | null;
  subcategory_id?: number | null;
  product_code: string;
  product_name: string;
  price: number | string;
  vat_rate?: number;
  quantity: number; // stock level
  image_url: string | null;
  is_active: boolean;
  description?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AssistedCartItem {
  product: Product;
  quantity: number;
  customPrice?: number | string;
}

interface CartState {
  // Standard Shop Cart
  items: CartItem[];
  customerShopReference: string;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setCustomerShopReference: (ref: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;

  // Assisted Order Cart & Customer State
  assistedItems: AssistedCartItem[];
  selectedShopId: number | "";
  discountType: "fixed" | "percentage" | "";
  discountValue: string;
  customerReference: string;
  internalNotes: string;

  addAssistedItem: (product: Product, quantity: number) => void;
  removeAssistedItem: (productId: number) => void;
  updateAssistedQuantity: (productId: number, quantity: number) => void;
  updateAssistedCustomPrice: (productId: number, customPrice: number | string) => void;
  setSelectedShopId: (shopId: number | "") => void;
  setDiscountType: (type: "fixed" | "percentage" | "") => void;
  setDiscountValue: (val: string) => void;
  setCustomerReference: (ref: string) => void;
  setInternalNotes: (notes: string) => void;
  clearAssistedOrder: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // 1. Standard Shop Cart Implementation
      items: [],
      customerShopReference: "",

      addItem: (product, quantity) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.product.id === product.id
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            return { items: updatedItems };
          }

          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
      },

      setCustomerShopReference: (ref) => {
        set({ customerShopReference: ref });
      },

      clearCart: () => {
        set({ items: [], customerShopReference: "" });
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = typeof item.product.price === "string"
            ? parseFloat(item.product.price)
            : item.product.price;
          return total + price * item.quantity;
        }, 0);
      },

      // 2. Assisted Order Cart & Customer Persistence Implementation
      assistedItems: [],
      selectedShopId: "",
      discountType: "",
      discountValue: "",
      customerReference: "",
      internalNotes: "",

      addAssistedItem: (product, quantity) => {
        set((state) => {
          const existingIndex = state.assistedItems.findIndex(
            (item) => item.product.id === product.id
          );

          if (existingIndex > -1) {
            const updated = [...state.assistedItems];
            updated[existingIndex].quantity += quantity;
            return { assistedItems: updated };
          }

          return {
            assistedItems: [...state.assistedItems, { product, quantity }],
          };
        });
      },

      removeAssistedItem: (productId) => {
        set((state) => ({
          assistedItems: state.assistedItems.filter(
            (item) => item.product.id !== productId
          ),
        }));
      },

      updateAssistedQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeAssistedItem(productId);
          return;
        }

        set((state) => ({
          assistedItems: state.assistedItems.map((item) =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      updateAssistedCustomPrice: (productId, customPrice) => {
        set((state) => ({
          assistedItems: state.assistedItems.map((item) =>
            item.product.id === productId
              ? { ...item, customPrice }
              : item
          ),
        }));
      },

      setSelectedShopId: (shopId) => {
        set({ selectedShopId: shopId });
      },

      setDiscountType: (type) => {
        set({ discountType: type });
      },

      setDiscountValue: (val) => {
        set({ discountValue: val });
      },

      setCustomerReference: (ref) => {
        set({ customerReference: ref });
      },

      setInternalNotes: (notes) => {
        set({ internalNotes: notes });
      },

      clearAssistedOrder: () => {
        set({
          assistedItems: [],
          selectedShopId: "",
          discountType: "",
          discountValue: "",
          customerReference: "",
          internalNotes: "",
        });
      },
    }),
    {
      name: "orbit_cart_storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
