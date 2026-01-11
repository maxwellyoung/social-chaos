import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_WIDTH = 1200;

// Floating Orb for background
const FloatingOrb = ({ color, size, initialX, initialY, duration }: {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  duration: number;
}) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(initialX + 80, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX - 50, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(initialY - 60, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY + 40, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY, { duration: duration * 0.5, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: duration * 0.5 }),
        withTiming(0.8, { duration: duration * 0.5 })
      ), -1, true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    opacity: 0.12,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={style} />;
};

const FEATURES = [
  {
    emoji: "🎯",
    title: "150+ Prompts",
    description: "Curated challenges across 8 categories",
  },
  {
    emoji: "🌶️",
    title: "Spicy Mode",
    description: "Turn up the heat for adults only",
  },
  {
    emoji: "⚡",
    title: "Chaos Levels",
    description: "From chill vibes to absolute mayhem",
  },
  {
    emoji: "⏱️",
    title: "Timed Challenges",
    description: "Race against the clock",
  },
  {
    emoji: "🎨",
    title: "8 Categories",
    description: "Drinking, dares, confessions & more",
  },
  {
    emoji: "✨",
    title: "Premium Design",
    description: "Beautiful, intuitive interface",
  },
];

const CATEGORIES = [
  { emoji: "🍻", name: "Drinking", color: "#F59E0B" },
  { emoji: "🎯", name: "Dares", color: "#EF4444" },
  { emoji: "🤫", name: "Confessions", color: "#A855F7" },
  { emoji: "🔥", name: "Hot Takes", color: "#F97316" },
  { emoji: "💪", name: "Physical", color: "#10B981" },
  { emoji: "💬", name: "Social", color: "#3B82F6" },
  { emoji: "🎨", name: "Creative", color: "#EC4899" },
  { emoji: "🌪️", name: "Chaos", color: "#8B5CF6" },
];

export default function Landing() {
  const handleAppStore = () => {
    Linking.openURL("https://apps.apple.com/app/id6737107968");
  };

  const handlePlayStore = () => {
    Linking.openURL("https://play.google.com/store/apps/details?id=com.maxwellyoung.socialchaos");
  };

  const handlePlayNow = () => {
    router.push("/");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0A", "#111111", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Orbs */}
      <View style={styles.orbContainer}>
        <FloatingOrb color="#8B5CF6" size={400} initialX={-100} initialY={50} duration={12000} />
        <FloatingOrb color="#EC4899" size={350} initialX={SCREEN_WIDTH - 150} initialY={200} duration={15000} />
        <FloatingOrb color="#3B82F6" size={300} initialX={50} initialY={600} duration={10000} />
        <FloatingOrb color="#F59E0B" size={250} initialX={SCREEN_WIDTH - 200} initialY={900} duration={13000} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.nav}>
          <Text style={styles.navLogo}>GAMBIT</Text>
          <View style={styles.navLinks}>
            <Pressable onPress={() => router.push("/privacy")} style={styles.navLink}>
              <Text style={styles.navLinkText}>Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/support")} style={styles.navLink}>
              <Text style={styles.navLinkText}>Support</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View entering={ZoomIn.delay(200).springify()}>
            <LinearGradient
              colors={["#8B5CF620", "#EC489920", "#3B82F620"]}
              style={styles.heroBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroBadgeText}>🎉 The #1 Party Game App</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(300).duration(800)} style={styles.heroTitle}>
            Party Chaos,{"\n"}Perfected
          </Animated.Text>

          <Animated.Text entering={FadeInUp.delay(400).duration(800)} style={styles.heroSubtitle}>
            150+ prompts. 8 categories. Infinite memories.{"\n"}
            The ultimate party game for unforgettable nights.
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.heroCTAs}>
            {Platform.OS === "web" ? (
              <>
                <Pressable style={styles.storeButton} onPress={handleAppStore}>
                  <LinearGradient
                    colors={["#FFFFFF", "#F5F5F7"]}
                    style={styles.storeButtonGradient}
                  >
                    <Ionicons name="logo-apple" size={24} color="#000" />
                    <View style={styles.storeButtonText}>
                      <Text style={styles.storeButtonSmall}>Download on the</Text>
                      <Text style={styles.storeButtonLarge}>App Store</Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                <Pressable style={styles.storeButton} onPress={handlePlayStore}>
                  <LinearGradient
                    colors={["#FFFFFF", "#F5F5F7"]}
                    style={styles.storeButtonGradient}
                  >
                    <Ionicons name="logo-google-playstore" size={22} color="#000" />
                    <View style={styles.storeButtonText}>
                      <Text style={styles.storeButtonSmall}>Get it on</Text>
                      <Text style={styles.storeButtonLarge}>Google Play</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.playButton} onPress={handlePlayNow}>
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  style={styles.playButtonGradient}
                >
                  <Text style={styles.playButtonText}>Play Now</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>

          {/* Phone Mockup */}
          <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.mockupContainer}>
            <LinearGradient
              colors={["#8B5CF630", "#EC489930"]}
              style={styles.mockupGlow}
            />
            <View style={styles.phoneMockup}>
              <LinearGradient
                colors={["#1A1A1A", "#111"]}
                style={styles.phoneScreen}
              >
                <Text style={styles.phoneTitle}>GAMBIT</Text>
                <View style={styles.phoneCard}>
                  <Text style={styles.phoneCardEmoji}>🍻</Text>
                  <Text style={styles.phoneCardText}>Everyone who's been{"\n"}skinny dipping, drink!</Text>
                </View>
                <Text style={styles.phoneHint}>← Swipe →</Text>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Animated.Text entering={FadeInUp.delay(100)} style={styles.sectionTitle}>
            Everything You Need
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(200)} style={styles.sectionSubtitle}>
            Designed for epic nights with friends
          </Animated.Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInUp.delay(300 + index * 80)}
                style={styles.featureCard}
              >
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Animated.Text entering={FadeInUp} style={styles.sectionTitle}>
            8 Wild Categories
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(100)} style={styles.sectionSubtitle}>
            Mix and match for your perfect game
          </Animated.Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat, index) => (
              <Animated.View
                key={cat.name}
                entering={ZoomIn.delay(200 + index * 60).springify()}
                style={[styles.categoryPill, { borderColor: cat.color + "50" }]}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryName, { color: cat.color }]}>{cat.name}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.ctaSection}>
          <LinearGradient
            colors={["#8B5CF615", "#EC489915"]}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaTitle}>Ready to Party?</Text>
            <Text style={styles.ctaSubtitle}>
              Download Gambit and make your next gathering legendary.
            </Text>

            <View style={styles.ctaButtons}>
              {Platform.OS === "web" ? (
                <>
                  <Pressable style={styles.ctaButton} onPress={handleAppStore}>
                    <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.ctaButtonGradient}>
                      <Ionicons name="logo-apple" size={20} color="#FFF" />
                      <Text style={styles.ctaButtonText}>App Store</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable style={styles.ctaButton} onPress={handlePlayStore}>
                    <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.ctaButtonGradient}>
                      <Ionicons name="logo-google-playstore" size={18} color="#FFF" />
                      <Text style={styles.ctaButtonText}>Google Play</Text>
                    </LinearGradient>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.ctaButton} onPress={handlePlayNow}>
                  <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.ctaButtonGradient}>
                    <Text style={styles.ctaButtonText}>Start Playing</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>GAMBIT</Text>
          <Text style={styles.footerTagline}>Party chaos, perfected.</Text>

          <View style={styles.footerLinks}>
            <Pressable onPress={() => router.push("/privacy")}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.footerDot}>•</Text>
            <Pressable onPress={() => router.push("/support")}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.footerDot}>•</Text>
            <Pressable onPress={() => router.push("/support")}>
              <Text style={styles.footerLink}>Support</Text>
            </Pressable>
          </View>

          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} Maxwell Young. Made with ❤️ in New Zealand.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: MAX_WIDTH,
    width: "100%",
    alignSelf: "center",
  },

  // Nav
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === "web" ? 20 : 60,
  },
  navLogo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 4,
  },
  navLinks: {
    flexDirection: "row",
    gap: 24,
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navLinkText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 80,
  },
  heroBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 24,
  },
  heroBadgeText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: Platform.OS === "web" ? 72 : 48,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    lineHeight: Platform.OS === "web" ? 80 : 56,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: Platform.OS === "web" ? 20 : 17,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: Platform.OS === "web" ? 32 : 26,
    maxWidth: 500,
    marginBottom: 40,
  },
  heroCTAs: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 16,
    marginBottom: 60,
  },
  storeButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  storeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 12,
  },
  storeButtonText: {
    alignItems: "flex-start",
  },
  storeButtonSmall: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  storeButtonLarge: {
    fontSize: 18,
    color: "#000",
    fontWeight: "700",
  },
  playButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  playButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 48,
    gap: 10,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },

  // Phone Mockup
  mockupContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  mockupGlow: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.5,
  },
  phoneMockup: {
    width: 280,
    height: 560,
    backgroundColor: "#000",
    borderRadius: 40,
    padding: 12,
    borderWidth: 3,
    borderColor: "#333",
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  phoneTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 4,
    marginBottom: 40,
  },
  phoneCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  phoneCardEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  phoneCardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
    lineHeight: 26,
  },
  phoneHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    marginTop: 24,
    letterSpacing: 2,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  sectionTitle: {
    fontSize: Platform.OS === "web" ? 42 : 32,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 40,
  },

  // Features
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  featureCard: {
    width: Platform.OS === "web" ? 320 : "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 22,
  },

  // Categories
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 10,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
  },

  // CTA
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  ctaGradient: {
    borderRadius: 32,
    padding: 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ctaTitle: {
    fontSize: Platform.OS === "web" ? 36 : 28,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 12,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 400,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 16,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 10,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  footerLogo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 4,
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 24,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  footerLink: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  footerDot: {
    fontSize: 14,
    color: "rgba(255,255,255,0.2)",
  },
  footerCopy: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
  },
});
