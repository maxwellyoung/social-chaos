import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
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

const DATA_ITEMS = [
  {
    icon: "people-outline" as const,
    title: "Player Names",
    description: "Names and avatars you've entered for game sessions",
  },
  {
    icon: "star-outline" as const,
    title: "Favorite Prompts",
    description: "Prompts you've saved as favorites",
  },
  {
    icon: "create-outline" as const,
    title: "Custom Prompts",
    description: "Prompts you've written yourself",
  },
  {
    icon: "settings-outline" as const,
    title: "Game Preferences",
    description: "Chaos level, game mode, and other settings",
  },
  {
    icon: "eye-off-outline" as const,
    title: "Skipped Prompts",
    description: "Prompts you've chosen to skip",
  },
];

export default function DeleteData() {
  const insets = useSafeAreaInsets();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently remove all your data from this device. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: performDeletion,
        },
      ]
    );
  };

  const performDeletion = async () => {
    setIsDeleting(true);
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      setIsDeleted(true);
    } catch (error) {
      console.error("Failed to delete data:", error);
      Alert.alert(
        "Error",
        "Something went wrong while deleting your data. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0A0A0A", "#111111", "#0A0A0A"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.centeredContent, { paddingTop: insets.top + 60 }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#34D399" />
          </View>
          <Text style={styles.successTitle}>Data Deleted</Text>
          <Text style={styles.successDescription}>
            All your data has been removed from this device.
          </Text>
          <Pressable
            style={styles.doneButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Delete My Data</Text>
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
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <LinearGradient
            colors={["rgba(239,68,68,0.15)", "rgba(239,68,68,0.05)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons
            name="warning-outline"
            size={32}
            color="#EF4444"
            style={styles.warningIcon}
          />
          <Text style={styles.warningTitle}>This cannot be undone</Text>
          <Text style={styles.warningDescription}>
            Deleting your data will permanently remove all locally stored
            information from this device. Your subscription (if any) will not be
            affected and can be managed through your device settings.
          </Text>
        </View>

        {/* Data Items */}
        <Text style={styles.sectionTitle}>Data that will be deleted</Text>
        {DATA_ITEMS.map((item, index) => (
          <View key={index} style={styles.dataItem}>
            <View style={styles.dataItemIcon}>
              <Ionicons name={item.icon} size={20} color="#EF4444" />
            </View>
            <View style={styles.dataItemContent}>
              <Text style={styles.dataItemTitle}>{item.title}</Text>
              <Text style={styles.dataItemDescription}>
                {item.description}
              </Text>
            </View>
          </View>
        ))}

        {/* Subscription Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color="#818CF8" />
          <Text style={styles.noteText}>
            Subscriptions are managed by Apple. To cancel a subscription, go to
            Settings {">"} Apple ID {">"} Subscriptions on your device.
          </Text>
        </View>

        {/* Delete Button */}
        <Pressable
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAll}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>
                Delete All My Data
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.footerNote}>
          If you have questions about your data, contact us at{" "}
          <Text style={styles.link}>maxwell@ninetynine.digital</Text>
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
    padding: 24,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  warningCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    overflow: "hidden",
    marginBottom: 32,
  },
  warningIcon: {
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
  },
  warningDescription: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      ios: "Inter-SemiBold",
      android: "Inter-SemiBold",
      default: "Inter-SemiBold, system-ui, sans-serif",
    }),
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  dataItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  dataItemContent: {
    flex: 1,
  },
  dataItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
    fontFamily: Platform.select({
      ios: "Inter-SemiBold",
      android: "Inter-SemiBold",
      default: "Inter-SemiBold, system-ui, sans-serif",
    }),
  },
  dataItemDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(129,140,248,0.08)",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
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
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
  },
  footerNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  link: {
    color: "#818CF8",
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
  },
  successDescription: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  doneButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  doneButtonText: {
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
