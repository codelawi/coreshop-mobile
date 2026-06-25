import { Text as RNText, TextProps } from "react-native";
import { useLanguageStore } from "@/stores/language-store";
import { useColorScheme } from "nativewind";

type Variant = "regular" | "medium" | "semibold" | "bold";

interface Props extends TextProps {
  variant?: Variant;
}

const fontMap = {
  en: {
    regular: "Manrope_400Regular",
    medium: "Manrope_500Medium",
    semibold: "Manrope_600SemiBold",
    bold: "Manrope_700Bold",
  },
  ar: {
    regular: "IBMPlexSansArabic_400Regular",
    medium: "IBMPlexSansArabic_500Medium",
    semibold: "IBMPlexSansArabic_600SemiBold",
    bold: "IBMPlexSansArabic_700Bold",
  },
};

export function Text({ variant = "regular", style, className, ...props }: Props & { className?: string }) {
  const language = useLanguageStore((s) => s.language);
  const { colorScheme } = useColorScheme();
  const fontFamily = fontMap[language][variant];
  const hasColor = className?.includes("text-");
  const defaultColor = colorScheme === "dark" ? "#FFFFFF" : "#0A0A0A";
  return (
    <RNText
      {...props}
      className={className}
      style={[{ fontFamily }, !hasColor && { color: defaultColor }, style]}
    />
  );
}
