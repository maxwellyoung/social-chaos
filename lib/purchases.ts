import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat API Keys - Replace with your actual keys from RevenueCat dashboard
const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "appl_YOUR_IOS_KEY",
  android:
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "goog_YOUR_ANDROID_KEY",
};

// Product identifiers - must match what you set up in App Store Connect / Play Console
export const PRODUCTS = {
  PARTY_PACK: "gambit_party_pack",
  SPICY_PACK: "gambit_spicy_pack",
  CHAOS_PACK: "gambit_chaos_pack",
  PREMIUM_BUNDLE: "gambit_premium_bundle",
} as const;

// Entitlement identifiers - set up in RevenueCat dashboard
export const ENTITLEMENTS = {
  PARTY_PACK: "party_pack",
  SPICY_PACK: "spicy_pack",
  CHAOS_PACK: "chaos_pack",
  PREMIUM: "premium",
} as const;

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Call this once at app startup
 */
export async function initializePurchases(): Promise<void> {
  if (isInitialized) return;

  try {
    const apiKey = Platform.OS === "ios" ? API_KEYS.ios : API_KEYS.android;

    // Skip initialization if no real key configured
    if (apiKey.includes("YOUR_")) {
      console.log("[Purchases] No API key configured, skipping initialization");
      return;
    }

    await Purchases.configure({ apiKey });
    isInitialized = true;
    console.log("[Purchases] Initialized successfully");
  } catch (error) {
    console.error("[Purchases] Failed to initialize:", error);
  }
}

/**
 * Get available offerings (products for sale)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("[Purchases] Failed to get offerings:", error);
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log("[Purchases] User cancelled purchase");
      return null;
    }
    console.error("[Purchases] Purchase failed:", error);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error("[Purchases] Restore failed:", error);
    return null;
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("[Purchases] Failed to get customer info:", error);
    return null;
  }
}

/**
 * Check if user has a specific entitlement
 */
export async function hasEntitlement(
  entitlementId: string
): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return (
      customerInfo.entitlements.active[entitlementId]?.isActive ?? false
    );
  } catch (error) {
    console.error("[Purchases] Failed to check entitlement:", error);
    return false;
  }
}

/**
 * Check if user has premium (any paid pack)
 */
export async function hasPremium(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    return activeEntitlements.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get all active entitlements
 */
export async function getActiveEntitlements(): Promise<string[]> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active);
  } catch (error) {
    return [];
  }
}
