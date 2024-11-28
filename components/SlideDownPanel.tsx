import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { ThemedView } from "./ThemedView";
import { BlurView } from "expo-blur";

interface SlideDownPanelProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SlideDownPanel({
  isVisible,
  onClose,
  children,
}: SlideDownPanelProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  return (
    <>
      {isVisible && (
        <TouchableWithoutFeedback onPress={onClose}>
          <BlurView intensity={10} style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView style={styles.content}>{children}</ThemedView>
          </TouchableWithoutFeedback>
        </BlurView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  blurContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  content: {
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
});
