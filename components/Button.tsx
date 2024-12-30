import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "default" | "accent";
}

export function Button({ title, onPress, variant = "default" }: ButtonProps) {
  return (
    <Pressable onPress={onPress}>
      {variant === "accent" ? (
        <View style={styles.buttonWrapper}>
          <LinearGradient
            colors={["#818CF8", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>{title}</Text>
          </LinearGradient>
        </View>
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4F46E5",
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 11,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Inter-Medium",
      android: "Inter-Medium",
      default:
        "Inter-Medium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    }),
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
