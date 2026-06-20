import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";

interface Props {
  title: string;
  action?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, action, onActionPress }: Props) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text variant="bold" className="text-lg text-brand">{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={6}>
          <Text variant="medium" className="text-sm" style={{ color: "#6B7280" }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}