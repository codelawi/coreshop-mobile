import { useColorScheme } from "nativewind";

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
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
