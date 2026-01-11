import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0A0A" },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="support" />
    </Stack>
  );
}
