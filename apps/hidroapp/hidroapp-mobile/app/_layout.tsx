import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { AppProvider } from "@/lib/app-context";
import { ThemeProvider, useThemeContext } from "@/lib/theme-provider";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

export const unstable_settings = { anchor: "(tabs)" };
function AppShell() {
  const { colorScheme } = useThemeContext();
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider initialMetrics={initialWindowMetrics}><AppProvider><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack><StatusBar style={colorScheme === "dark" ? "light" : "dark"} /></AppProvider></SafeAreaProvider></GestureHandlerRootView>;
}
export default function RootLayout() { return <ThemeProvider><AppShell /></ThemeProvider>; }
