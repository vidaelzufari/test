import { create } from "zustand";
import { CustomerInfo } from "react-native-purchases";
import {
  configureRevenueCat,
  fetchCustomerInfo,
  isQueenUnlocked,
  purchaseQueenUnlock,
  restorePurchases,
} from "@/services/revenuecat";

interface EntitlementState {
  isUnlocked: boolean;
  isLoading: boolean;
  init: () => Promise<void>;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useEntitlementStore = create<EntitlementState>()((set) => ({
  isUnlocked: false,
  isLoading: true,

  init: async () => {
    configureRevenueCat();
    try {
      const info = await fetchCustomerInfo();
      set({ isUnlocked: isQueenUnlocked(info), isLoading: false });
    } catch {
      // Offline or not configured yet — logger/history/profile stay usable regardless.
      set({ isLoading: false });
    }
  },

  purchase: async () => {
    const info: CustomerInfo = await purchaseQueenUnlock();
    set({ isUnlocked: isQueenUnlocked(info) });
  },

  restore: async () => {
    const info = await restorePurchases();
    set({ isUnlocked: isQueenUnlocked(info) });
  },
}));
