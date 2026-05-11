import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';

export interface StockBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  isVerified: boolean;
  isMigrated: boolean;
  sellingPrice: number;
  mrp: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  currentStock: number;
  gstRate: number;
  unit: string;
  categoryId?: string;
  batches?: StockBatch[];
  hasMedicalInfo?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  rate: number;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  selectedBatchId?: string;
}

interface CartStore {
  cart: CartItem[];
  customer: Customer | null;
  paymentMode: string;
  amountPaid: string;
  lastUpdated: number;

  // Actions
  addToCart: (product: Product, selectedBatchId?: string) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateDiscount: (cartId: string, type: 'PERCENT' | 'FLAT', value: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setPaymentMode: (mode: string) => void;
  setAmountPaid: (amount: string) => void;
  clearCart: () => void;
  
  // Totals
  getTotals: () => {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      customer: null,
      paymentMode: 'CASH',
      amountPaid: '',
      lastUpdated: Date.now(),

      addToCart: (product, selectedBatchId) => {
        const cartId = `${product.id}-${selectedBatchId || 'default'}`;
        const existingItem = get().cart.find((item) => item.cartId === cartId);

        if (existingItem) {
          get().updateQuantity(cartId, existingItem.quantity + 1);
        } else {
          const newItem: CartItem = {
            ...product,
            cartId,
            quantity: 1,
            rate: product.sellingPrice,
            discountType: 'PERCENT',
            discountValue: 0,
            selectedBatchId,
          };
          set({ 
            cart: [...get().cart, newItem],
            lastUpdated: Date.now()
          });
        }
      },

      removeFromCart: (cartId) => {
        set({ 
          cart: get().cart.filter((item) => item.cartId !== cartId),
          lastUpdated: Date.now()
        });
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity < 1) return;
        set({
          cart: get().cart.map((item) =>
            item.cartId === cartId ? { ...item, quantity } : item
          ),
          lastUpdated: Date.now()
        });
      },

      updateDiscount: (cartId, type, value) => {
        set({
          cart: get().cart.map((item) =>
            item.cartId === cartId ? { ...item, discountType: type, discountValue: value } : item
          ),
          lastUpdated: Date.now()
        });
      },

      setCustomer: (customer) => set({ customer }),
      setPaymentMode: (mode) => set({ paymentMode: mode }),
      setAmountPaid: (amount) => set({ amountPaid: amount }),

      clearCart: () => set({ 
        cart: [], 
        customer: null, 
        amountPaid: '', 
        paymentMode: 'CASH',
        lastUpdated: Date.now()
      }),

      getTotals: () => {
        const cart = get().cart;
        let subtotal = 0;
        let tax = 0;
        let totalDiscount = 0;

        cart.forEach((item) => {
          const itemTotal = item.rate * item.quantity;
          let itemDiscount = 0;

          if (item.discountType === 'PERCENT') {
            itemDiscount = (itemTotal * item.discountValue) / 100;
          } else {
            itemDiscount = item.discountValue;
          }

          const taxableAmount = itemTotal - itemDiscount;
          const itemTax = (taxableAmount * item.gstRate) / 100;

          subtotal += taxableAmount;
          tax += itemTax;
          totalDiscount += itemDiscount;
        });

        return {
          subtotal,
          tax,
          discount: totalDiscount,
          total: subtotal + tax,
        };
      },
    }),
    {
      name: 'pos-cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return (rehydratedState) => {
          if (rehydratedState && rehydratedState.cart.length > 0) {
            // Check for stale cart (e.g. older than 24 hours to match new policy)
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (Date.now() - rehydratedState.lastUpdated > twentyFourHours) {
              rehydratedState.clearCart();
            }
          }
        };
      },
    }
  )
);
