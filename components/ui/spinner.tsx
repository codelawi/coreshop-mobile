import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useThemeColors } from "@/lib/theme";

interface SpinnerProps {
  size?: number;
  color?: string;
  trackColor?: string;
  strokeWidth?: number;
  speed?: number;
}

export function Spinner({
  size = 32,
  color,
  trackColor,
  strokeWidth = 3,
  speed = 800,
}: SpinnerProps) {
  const c = useThemeColors();
  const arcColor = color ?? c.brand;

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: speed, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(rotation);
    };
  }, [speed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Animated.View style={[animStyle, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track — arc color at 10% opacity (ring-2 bg-opacity="0.1") */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={trackColor ?? arcColor}
          strokeWidth={strokeWidth}
          strokeOpacity={trackColor ? 1 : 0.1}
          fill="none"
        />
        {/* Arc — 25% visible, starts from 12 o'clock (ring-2 stroke-length="0.25") */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={arcColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.75}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      </Svg>
    </Animated.View>
  );
}
