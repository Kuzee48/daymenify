import { create } from 'zustand';

import type { Product } from '@/services/api.types';

export interface CustomerData {
  userId?: string;
  serverId?: string;
  phone?: string;
}

export interface CheckoutState {
  selectedProduct: Product | null;
  customerData: CustomerData;
  selectedPaymentMethod: string | null;
  voucherCode: string;
  step: number;
}

export interface CheckoutActions {
  setProduct: (product: Product | null) => void;
  setCustomerData: (data: CustomerData) => void;
  setPaymentMethod: (method: string) => void;
  setVoucher: (code: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export type CheckoutStore = CheckoutState & CheckoutActions;

const initialState: CheckoutState = {
  selectedProduct: null,
  customerData: {},
  selectedPaymentMethod: null,
  voucherCode: '',
  step: 1,
};

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  ...initialState,

  setProduct: (product) => {
    set({ selectedProduct: product });
  },

  setCustomerData: (data) => {
    set({ customerData: data });
  },

  setPaymentMethod: (method) => {
    set({ selectedPaymentMethod: method });
  },

  setVoucher: (code) => {
    set({ voucherCode: code });
  },

  nextStep: () => {
    set((state) => ({ step: Math.min(state.step + 1, 5) }));
  },

  prevStep: () => {
    set((state) => ({ step: Math.max(state.step - 1, 1) }));
  },

  reset: () => {
    set(initialState);
  },
}));
