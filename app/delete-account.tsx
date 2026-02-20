import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logoutUser } from "../lib/purchases";

export default function DeleteAccount() {
  const insets = useSafeAreaInsets();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently erase all your data, including saved prompts, preferences, and purchase history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Clear all local data
      await AsyncStorage.clear();

      // Log out of RevenueCat (creates anonymous user, detaches purchases)
      await logoutUser();

      Alert.alert(
        "Account Deleted",
        "Your account and all associated data have been deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert(
        "Error",
        "Something went wrong while deleting your account. Please try again or contact support at maxwell@ninetynine.digital."
      );
    } finally {
      setIsDeleting(false);
    }
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
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.warningCard}>
          <Ionicons
            name="warning-outline"
            size={48}
            color="#EF4444"
            style={styles.warningIcon}
          />
          <Text style={styles.warningTitle}>Delete Your Account</Text>
          <Text style={styles.warningDescription}>
            This will permanently delete all your data associated with Gambit,
            including:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Saved and custom prompts</Text>
            <Text style={styles.bulletItem}>• Game preferences and settings</Text>
            <Text style={styles.bulletItem}>• Favorites and skipped prompts</Text>
          </View>
          <Text style={styles.warningNote}>
            If you have an active subscription, please cancel it through your{" "}
            {Platform.OS === "ios" ? "Apple ID" : "Google Play"} settings before
            deleting your account.
          </Text>
        </View>

        <Pressable
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </>
          )}
        </Pressable>
      </View>
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
  content: {
    flex: 1,
    padding: 24,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  warningCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  warningIcon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
  },
  warningDescription: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  bulletList: {
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  warningNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 20,
    fontStyle: "italic",
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Inter-SemiBold",
      android: "Inter-SemiBold",
      default: "Inter-SemiBold, system-ui, sans-serif",
    }),
  },
});
