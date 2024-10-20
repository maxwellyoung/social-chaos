import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { ThemedView } from "@/components/ThemedView";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === "dark" ? "#1D1D1F" : "#F5F5F7",
          },
          headerTintColor: colorScheme === "dark" ? "#F5F5F7" : "#1D1D1F",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </ThemedView>
  );
}
