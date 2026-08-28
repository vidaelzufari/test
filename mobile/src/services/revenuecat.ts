import { Platform } from "react-native";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { QUEEN_UNLOCK_ENTITLEMENT_ID } from "@/config/app";

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

let configured = false;

/**
 * Wires RevenueCat for the single "Queen Unlock" non-consumable. The
 * four-button logger, history, and profile never check this — only the
 * recommendations engine and stash forecasting screens gate on it.
 */
export function configureRevenueCat(): void {
  if (configured) return;
  const apiKey = Platform.OS === "ios" ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) return; // no-op in dev without keys configured
  Purchases.configure({ apiKey });
  configured = true;
}

export function isQueenUnlocked(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[QUEEN_UNLOCK_ENTITLEMENT_ID]);
}

export async function fetchCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function purchaseQueenUnlock(): Promise<CustomerInfo> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];
  if (!pkg) throw new Error("Queen Unlock package is not configured in RevenueCat.");
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
