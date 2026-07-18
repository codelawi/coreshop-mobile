import { useColorScheme } from "nativewind";
import { useThemeStore } from "@/stores/theme-store";

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const isDark = colorScheme === "dark";

  if (mode === "pink") {
    return {
      bg: "#FFF0F6",
      card: "#FFFFFF",
      brand: "#1A1A1A",
      secondary: "#9D174D",
      muted: "#BE185D",
      border: "#FECDD3",
      brandLight: "#FCE4EC",
      tabBar: "#FFFFFF",
      tabBorder: "#FECDD3",
      inputBg: "#FFFFFF",
      inputBorder: "#FECDD3",
      placeholder: "#D1649E",
      isDark: false,
    } as const;
  }

  return {
    bg: isDark ? "#0A0A0A" : "#FAFAFA",
    card: isDark ? "#1A1A1A" : "#FFFFFF",
    brand: isDark ? "#FFFFFF" : "#0A0A0A",
    secondary: isDark ? "#9CA3AF" : "#6B7280",
    muted: isDark ? "#6B7280" : "#9CA3AF",
    border: isDark ? "#2A2A2A" : "#E5E7EB",
    brandLight: isDark ? "#2A2A2A" : "#F5F5F5",
    tabBar: isDark ? "#1A1A1A" : "#FFFFFF",
    tabBorder: isDark ? "#2A2A2A" : "#E5E5E5",
    inputBg: isDark ? "#1A1A1A" : "#FFFFFF",
    inputBorder: isDark ? "#3A3A3A" : "#E5E5E5",
    placeholder: isDark ? "#6B7280" : "#9CA3AF",
    isDark,
  } as const;
}
