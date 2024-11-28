import React from "react";
import { TouchableOpacity, StyleSheet, View, ViewStyle } from "react-native";
import { ThemedText } from "./ThemedText";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant: "accent" | "default";
  style?: ViewStyle;
}

type GradientWrapperProps = Omit<LinearGradientProps, "children"> & {
  children?: React.ReactNode;
};

type ViewWrapperProps = {
  style?: ViewStyle;
  children?: React.ReactNode;
};

const GradientWrapper: React.FC<GradientWrapperProps> = ({
  children,
  ...props
}) => <LinearGradient {...props}>{children}</LinearGradient>;

const ViewWrapper: React.FC<ViewWrapperProps> = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export function Button({
  title,
  onPress,
  variant = "default",
  style,
}: ButtonProps) {
  const wrapperProps =
    variant === "default"
      ? {
          colors: ["#E5E5EA", "#D1D1D6"],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
          style: styles.buttonContent,
        }
      : {
          style: styles.buttonContent,
        };

  const textStyle = [styles.text, variant === "accent" && styles.accentText];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "accent" && styles.accentButton,
        style,
      ]}
      onPress={onPress}
    >
      {variant === "default" ? (
        <GradientWrapper {...(wrapperProps as GradientWrapperProps)}>
          <ThemedText style={textStyle}>{title}</ThemedText>
        </GradientWrapper>
      ) : (
        <ViewWrapper {...(wrapperProps as ViewWrapperProps)}>
          <ThemedText style={textStyle}>{title}</ThemedText>
        </ViewWrapper>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    padding: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  accentButton: {
    backgroundColor: "#FF2D55",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  accentText: {
    color: "#FFFFFF",
  },
});
