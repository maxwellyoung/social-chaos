"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PurchasesPackage, PurchasesOffering } from "react-native-purchases";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  ENTITLEMENTS,
} from "../lib/purchases";
import { Ionicons } from "@expo/vector-icons";

interface PaywallProps {
  onClose: () => void;
  onPurchaseSuccess: (entitlements: string[]) => void;
}

interface PackInfo {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features: string[];
}

const PACK_INFO: Record<string, PackInfo> = {
  [ENTITLEMENTS.PARTY_PACK]: {
    id: ENTITLEMENTS.PARTY_PACK,
    name: "Party Pack",
    description: "100+ exclusive party prompts",
    icon: "sparkles",
    color: "#FF6B6B",
    features: [
      "100+ new party prompts",
      "Group challenges",
      "Ice breakers",
      "Party games",
    ],
  },
  [ENTITLEMENTS.SPICY_PACK]: {
    id: ENTITLEMENTS.SPICY_PACK,
    name: "Spicy Pack",
    description: "Turn up the heat",
    icon: "flame",
    color: "#FF8C42",
    features: [
      "50+ adult prompts",
      "Drinking challenges",
      "Truth or dare specials",
      "21+ content",
    ],
  },
  [ENTITLEMENTS.CHAOS_PACK]: {
    id: ENTITLEMENTS.CHAOS_PACK,
    name: "Chaos Pack",
    description: "Maximum mayhem",
    icon: "flash",
    color: "#9B59B6",
    features: [
      "75+ extreme challenges",
      "Wild dares",
      "Chaos level 11+",
      "No limits mode",
    ],
  },
  [ENTITLEMENTS.PREMIUM]: {
    id: ENTITLEMENTS.PREMIUM,
    name: "Premium Bundle",
    description: "All packs + future updates",
    icon: "diamond",
    color: "#F1C40F",
    features: [
      "All current packs included",
      "All future packs FREE",
      "Early access to new content",
      "Best value!",
    ],
  },
};

export function Paywall({ onClose, onPurchaseSuccess }: PaywallProps) {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    setError(null);
    const offering = await getOfferings();
    if (offering) {
      setOfferings(offering);
    } else {
      setError("Unable to load store. Please try again.");
    }
    setLoading(false);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(pkg.identifier);
    setError(null);

    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        const activeEntitlements = Object.keys(
          customerInfo.entitlements.active
        );
        onPurchaseSuccess(activeEntitlements);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setPurchasing("restore");
    setError(null);

    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        const activeEntitlements = Object.keys(
          customerInfo.entitlements.active
        );
        if (activeEntitlements.length > 0) {
          onPurchaseSuccess(activeEntitlements);
          onClose();
        } else {
          setError("No previous purchases found.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Restore failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const renderPackage = (pkg: PurchasesPackage) => {
    const info = PACK_INFO[pkg.identifier] || {
      name: pkg.product.title,
      description: pkg.product.description,
      icon: "gift" as const,
      color: "#666",
      features: [],
    };

    const isLoading = purchasing === pkg.identifier;
    const featuresText = info.features.join(", ");

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[styles.packageCard, { borderColor: info.color + "40" }]}
        onPress={() => handlePurchase(pkg)}
        disabled={purchasing !== null}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${info.name} - ${info.description}. Price: ${pkg.product.priceString}`}
        accessibilityHint={`Double tap to purchase. Includes: ${featuresText}`}
        accessibilityState={{ disabled: purchasing !== null, busy: isLoading }}
      >
        <LinearGradient
          colors={[info.color + "20", "transparent"]}
          style={styles.packageGradient}
        />

        <View style={styles.packageHeader}>
          <View style={[styles.iconContainer, { backgroundColor: info.color }]} accessibilityElementsHidden={true}>
            <Ionicons name={info.icon} size={24} color="#FFF" />
          </View>
          <View style={styles.packageTitleContainer}>
            <Text style={styles.packageName}>{info.name}</Text>
            <Text style={styles.packageDescription}>{info.description}</Text>
          </View>
        </View>

        <View style={styles.featuresContainer} accessibilityElementsHidden={true}>
          {info.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={info.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.priceButton, { backgroundColor: info.color }]} accessibilityElementsHidden={true}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.priceText}>
              {pkg.product.priceString}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f0f1a"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close store"
          accessibilityHint="Double tap to close the store and return to the game"
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">Unlock More Fun</Text>
        <Text style={styles.subtitle}>
          Get exclusive prompt packs to level up your game nights
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer} accessibilityRole="progressbar" accessibilityLabel="Loading store">
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading store...</Text>
        </View>
      ) : error && !offerings ? (
        <View style={styles.errorContainer} accessibilityRole="alert">
          <Ionicons name="cloud-offline" size={48} color="#FF6B6B" accessibilityElementsHidden={true} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadOfferings}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Double tap to reload the store"
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.packagesContainer}
          contentContainerStyle={styles.packagesContent}
          showsVerticalScrollIndicator={false}
        >
          {offerings?.availablePackages.map(renderPackage)}

          {error && (
            <Text style={styles.inlineError} accessibilityRole="alert">{error}</Text>
          )}

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing !== null}
            accessibilityRole="button"
            accessibilityLabel="Restore Purchases"
            accessibilityHint="Double tap to restore previously purchased items"
            accessibilityState={{ disabled: purchasing !== null, busy: purchasing === "restore" }}
          >
            {purchasing === "restore" ? (
              <ActivityIndicator color="#888" size="small" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          <Text style={styles.legalText} accessibilityLabel="Legal notice">
            Payment will be charged to your {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account.
            Purchases are non-refundable. By purchasing, you agree to our Terms of Service.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#AAA",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#888",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    color: "#FF6B6B",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#FF6B6B",
    borderRadius: 24,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  packagesContainer: {
    flex: 1,
  },
  packagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  packageCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  packageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  packageTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  packageName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  packageDescription: {
    fontSize: 14,
    color: "#AAA",
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: "#DDD",
    fontSize: 14,
  },
  priceButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  priceText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  inlineError: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 16,
  },
  restoreButton: {
    padding: 16,
    alignItems: "center",
  },
  restoreText: {
    color: "#888",
    fontSize: 14,
  },
  legalText: {
    color: "#555",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
