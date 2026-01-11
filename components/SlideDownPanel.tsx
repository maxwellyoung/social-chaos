import React from "react";
import { StyleSheet, View, Pressable, Platform, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface SlideDownPanelProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_WIDTH = 500;

export function SlideDownPanel({
  isVisible,
  onClose,
  children,
}: SlideDownPanelProps) {
  const slideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withSpring(isVisible ? 0 : -600, {
          damping: 28,
          stiffness: 280,
          mass: 0.8,
        }),
      },
      {
        scale: withSpring(isVisible ? 1 : 0.9, {
          damping: 28,
          stiffness: 280,
        }),
      },
    ],
    opacity: withTiming(isVisible ? 1 : 0, { duration: 150 }),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isVisible ? 1 : 0, { duration: 200 }),
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.panelWrapper, slideStyle]}>
        <View style={styles.panel}>
          {/* Gradient border effect */}
          <LinearGradient
            colors={["rgba(139,92,246,0.3)", "rgba(236,72,153,0.1)", "transparent"]}
            style={styles.gradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Content */}
          <View style={styles.innerContent}>{children}</View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 1000,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  panelWrapper: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? MAX_WIDTH : "100%",
    paddingHorizontal: Platform.OS === "web" ? 0 : 0,
  },
  panel: {
    backgroundColor: "#0A0A0A",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  gradientBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  innerContent: {
    paddingTop: 4,
  },
});
