import { ActivityIndicator, Pressable, PressableProps, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const variantBg: Record<Variant, string> = {
  primary: "bg-brand",
  secondary: "bg-brand-50",
  outline: "bg-transparent border border-brand",
  ghost: "bg-transparent",
};

const variantTextColor: Record<Variant, string> = {
  primary: "#FFFFFF",
  secondary: "#0A0A0A",
  outline: "#0A0A0A",
  ghost: "#0A0A0A",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-10 px-4",
  md: "h-12 px-6",
  lg: "h-14 px-8",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  ...props
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 80 });
        opacity.value = withTiming(0.85, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
      style={[animatedStyle, { justifyContent: "center", alignItems: "center" }]}
      className={`flex-row rounded-md ${variantBg[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantTextColor[variant]} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {leftIcon}
          <Text variant="semibold" style={{ color: variantTextColor[variant], fontSize: 16, textAlign: "center" }}>
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </AnimatedPressable>
  );
}