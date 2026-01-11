import React, { useEffect, useMemo } from "react";
import { StyleSheet, View, Platform, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

interface BlobConfig {
  color: string;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

interface FluidGradientProps {
  colors?: string[];
  speed?: number;
  blur?: number;
  style?: any;
}

const FluidBlob = ({ config, blur }: { config: BlobConfig; blur: number }) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Organic movement pattern
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Breathing scale effect
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: config.duration * 0.7, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: config.duration * 0.7, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: config.duration * 3, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Create organic, fluid movement paths
    const moveX = interpolate(
      progress.value,
      [0, 0.25, 0.5, 0.75, 1],
      [0, 80, 40, -60, 0]
    );
    const moveY = interpolate(
      progress.value,
      [0, 0.33, 0.66, 1],
      [0, -70, 50, 0]
    );

    return {
      transform: [
        { translateX: config.x + moveX },
        { translateY: config.y + moveY },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: 0.7,
    };
  });

  const blobStyle = useMemo(() => ({
    position: "absolute" as const,
    width: config.size,
    height: config.size,
    borderRadius: config.size / 2,
    backgroundColor: config.color,
    ...(isWeb && {
      filter: `blur(${blur}px)`,
      mixBlendMode: "screen" as const,
    }),
  }), [config, blur]);

  return <Animated.View style={[blobStyle, animatedStyle]} />;
};

export function FluidGradient({
  colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"],
  speed = 1,
  blur = 100,
  style,
}: FluidGradientProps) {
  // Generate blob configurations based on colors
  const blobs = useMemo((): BlobConfig[] => {
    return colors.map((color, index) => {
      const angle = (index / colors.length) * Math.PI * 2;
      const radius = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.3;

      return {
        color,
        size: 250 + Math.random() * 200,
        x: SCREEN_WIDTH / 2 + Math.cos(angle) * radius - 200,
        y: SCREEN_HEIGHT / 3 + Math.sin(angle) * radius - 150,
        duration: (8000 + Math.random() * 4000) / speed,
        delay: index * 500,
      };
    });
  }, [colors, speed]);

  // Add extra blobs for more fluid effect
  const extraBlobs = useMemo((): BlobConfig[] => {
    return colors.slice(0, 3).map((color, index) => ({
      color,
      size: 180 + Math.random() * 150,
      x: Math.random() * SCREEN_WIDTH - 100,
      y: Math.random() * SCREEN_HEIGHT * 0.6,
      duration: (10000 + Math.random() * 5000) / speed,
      delay: 1000 + index * 700,
    }));
  }, [colors, speed]);

  const allBlobs = [...blobs, ...extraBlobs];

  return (
    <View style={[styles.container, style]}>
      {/* Dark base */}
      <View style={styles.darkBase} />

      {/* Gradient blobs */}
      <View style={styles.blobContainer}>
        {allBlobs.map((blob, index) => (
          <FluidBlob key={index} config={blob} blur={blur} />
        ))}
      </View>

      {/* Overlay for depth */}
      <View style={styles.overlay} />

      {/* Noise texture overlay for grain effect */}
      {isWeb && <View style={styles.noiseOverlay} />}
    </View>
  );
}

// Simpler version for lower-end devices
export function FluidGradientSimple({
  colors = ["#8B5CF6", "#EC4899", "#3B82F6"],
  style,
}: {
  colors?: string[];
  style?: any;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.darkBase} />
      <Animated.View style={[styles.simpleGradient, animatedStyle]}>
        {colors.map((color, i) => (
          <View
            key={i}
            style={[
              styles.simpleBlob,
              {
                backgroundColor: color,
                left: `${20 + i * 25}%`,
                top: `${15 + i * 20}%`,
                width: 300 - i * 30,
                height: 300 - i * 30,
              },
            ]}
          />
        ))}
      </Animated.View>
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#050505",
  },
  darkBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#050505",
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    ...(isWeb && {
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }),
  },
  simpleGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  simpleBlob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.4,
    ...(isWeb && {
      filter: "blur(80px)",
    }),
  },
});
