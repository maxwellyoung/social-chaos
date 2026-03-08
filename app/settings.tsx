import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_VERSION = "1.0.3";
const PRIVACY_URL = "https://gambit.ninetynine.digital/privacy";
const TERMS_URL = "https://gambit.ninetynine.digital/support";
const SUPPORT_EMAIL = "maxwell@ninetynine.digital";
const SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { isProUser, restore } = useRevenueCat();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const restored = await restore();
      Alert.alert(
        restored ? "Purchases Restored" : "No Purchases Found",
        restored
          ? "Your Gambit Pro subscription has been restored."
          : "No previous purchases were found for this account."
      );
    } catch {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteAccount = () => {
    if (isProUser) {
      Alert.alert(
        "Active Subscription",
        "You have an active Gambit Pro subscription. Deleting your data will NOT cancel your subscription. Please cancel it first in your App Store settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Manage Subscription",
            onPress: () => Linking.openURL(SUBSCRIPTIONS_URL),
          },
          {
            text: "Delete Anyway",
            style: "destructive",
            onPress: confirmDelete,
          },
        ]
      );
    } else {
      Alert.alert(
        "Delete All Data",
        "This will permanently delete all your game data, preferences, saved players, and favorites. This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Everything",
            style: "destructive",
            onPress: confirmDelete,
          },
        ]
      );
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.clear();

      Alert.alert(
        "Data Deleted",
        "All your Gambit data has been removed.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch {
      Alert.alert("Error", "Failed to delete data. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContact = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Gambit%20Support`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0A", "#111111", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={20}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(139,92,246,0.15)" }]}>
                <Ionicons name="refresh" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.rowText}>Restore Purchases</Text>
            </View>
            {isRestoring ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            )}
          </Pressable>

          {isProUser && (
            <Pressable
              style={styles.row}
              onPress={() => Linking.openURL(SUBSCRIPTIONS_URL)}
              accessibilityRole="button"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: "rgba(245,158,11,0.15)" }]}>
                  <Ionicons name="card" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.rowText}>Manage Subscription</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.3)" />
            </Pressable>
          )}

          <View style={styles.rowStatus}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: isProUser ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)" }]}>
                <Ionicons
                  name={isProUser ? "diamond" : "diamond-outline"}
                  size={20}
                  color={isProUser ? "#10B981" : "rgba(255,255,255,0.4)"}
                />
              </View>
              <Text style={styles.rowText}>Status</Text>
            </View>
            <Text style={[styles.statusBadge, isProUser && styles.statusBadgePro]}>
              {isProUser ? "PRO" : "FREE"}
            </Text>
          </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() => Linking.openURL(PRIVACY_URL)}
            accessibilityRole="link"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.rowText}>Privacy Policy</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.3)" />
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => Linking.openURL(TERMS_URL)}
            accessibilityRole="link"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                <Ionicons name="document-text" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.rowText}>Terms of Service</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.3)" />
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={handleContact}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(236,72,153,0.15)" }]}>
                <Ionicons name="mail" size={20} color="#EC4899" />
              </View>
              <Text style={styles.rowText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
          </Pressable>

          <View style={styles.rowStatus}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                <Ionicons name="information-circle" size={20} color="rgba(255,255,255,0.4)" />
              </View>
              <Text style={styles.rowText}>Version</Text>
            </View>
            <Text style={styles.versionText}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Delete all data"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
                <Ionicons name="trash" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.rowText, { color: "#EF4444" }]}>
                Delete All Data
              </Text>
            </View>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="rgba(239,68,68,0.3)" />
            )}
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          Deleting your data removes all saved players, favorites, and preferences from this device.
          {isProUser
            ? " Your subscription must be cancelled separately through the App Store."
            : ""}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Inter-SemiBold",
      android: "Inter-SemiBold",
      default: "Inter-SemiBold, system-ui, sans-serif",
    }),
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.5,
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  rowStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "Inter-Medium",
      android: "Inter-Medium",
      default: "Inter-Medium, system-ui, sans-serif",
    }),
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    letterSpacing: 1,
  },
  statusBadgePro: {
    color: "#10B981",
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  versionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  footerNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    lineHeight: 20,
    marginTop: 16,
    marginHorizontal: 4,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
});
