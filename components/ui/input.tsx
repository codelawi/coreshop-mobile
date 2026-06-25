import { TextInput, TextInputProps, View } from "react-native";
import { Text } from "./text";
import { useThemeColors } from "@/lib/theme";
import { forwardRef } from "react";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, Props>(
  ({ label, error, leftIcon, rightIcon, style, ...props }, ref) => {
    const c = useThemeColors();
    return (
      <View className="w-full gap-2">
        {label && (
          <Text variant="medium" className="text-sm text-brand dark:text-white">
            {label}
          </Text>
        )}
        <View
          className={`h-14 flex-row items-center rounded-md border px-4 ${
            error ? "border-accent" : "border-brand-100 dark:border-[#3A3A3A]"
          }`}
          style={{ backgroundColor: c.inputBg }}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={c.placeholder}
            spellCheck={false}
            autoCorrect={false}
            className="flex-1 text-base"
            style={[{ fontFamily: "Manrope_400Regular", color: c.brand }, style]}
            {...props}
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && (
          <Text variant="medium" className="text-xs" style={{ color: "#FF4D4F" }}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);
