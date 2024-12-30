import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface SlideDownPanelProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function SlideDownPanel({
  isVisible,
  onClose,
  children,
}: SlideDownPanelProps) {
  const slideStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(isVisible ? 0 : -800, {
            damping: 20,
            stiffness: 90,
          }),
        },
      ],
      opacity: withTiming(isVisible ? 1 : 0, { duration: 200 }),
    };
  });

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.panel, slideStyle]}>
        <View style={styles.handle} />
        <View style={styles.innerContent}>{children}</View>
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
    zIndex: 1000,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  innerContent: {
    paddingTop: 8,
  },
});
