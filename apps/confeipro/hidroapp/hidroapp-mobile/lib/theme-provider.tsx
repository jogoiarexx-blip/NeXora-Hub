import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = { colorScheme: ColorScheme; setColorScheme: (scheme: ColorScheme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "hidro_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme); Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") { const root = document.documentElement; root.dataset.theme = scheme; root.classList.toggle("dark", scheme === "dark"); Object.entries(SchemeColors[scheme]).forEach(([token, value]) => root.style.setProperty(`--color-${token}`, value)); }
  }, []);
  useEffect(() => { AsyncStorage.getItem(THEME_KEY).then(v => { if (v === "light" || v === "dark") setColorSchemeState(v); }).catch(() => {}); }, []);
  useEffect(() => { applyScheme(colorScheme); }, [applyScheme, colorScheme]);
  const setColorScheme = useCallback((scheme: ColorScheme) => { setColorSchemeState(scheme); applyScheme(scheme); void AsyncStorage.setItem(THEME_KEY, scheme); }, [applyScheme]);
  const themeVariables = useMemo(() => vars({ "color-primary": SchemeColors[colorScheme].primary, "color-background": SchemeColors[colorScheme].background, "color-surface": SchemeColors[colorScheme].surface, "color-foreground": SchemeColors[colorScheme].foreground, "color-muted": SchemeColors[colorScheme].muted, "color-border": SchemeColors[colorScheme].border, "color-success": SchemeColors[colorScheme].success, "color-warning": SchemeColors[colorScheme].warning, "color-error": SchemeColors[colorScheme].error }), [colorScheme]);
  return <ThemeContext.Provider value={{ colorScheme, setColorScheme }}><View style={[{ flex: 1 }, themeVariables]}>{children}</View></ThemeContext.Provider>;
}
export function useThemeContext() { const ctx = useContext(ThemeContext); if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider"); return ctx; }
