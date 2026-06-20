import { TextInput, TextInputProps, View } from "react-native";
import { Text } from "./text";
import { forwardRef } from "react";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, Props>(
  ({ label, error, leftIcon, rightIcon, style, ...props }, ref) => {
    return (
      <View className="w-full gap-2">
        {label && (
          <Text variant="medium" className="text-sm text-brand">
            {label}
          </Text>
        )}
        <View
          className={`h-14 flex-row items-center rounded-md border bg-white px-4 ${
            error ? "border-accent" : "border-brand-100"
          }`}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor="#9CA3AF"
            spellCheck={false}
            autoCorrect={false}
            className="flex-1 text-base"
            style={[{ fontFamily: "Manrope_400Regular", color: "#0A0A0A" }, style]}
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