import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Location01Icon,
  PlusSignIcon,
  Edit02Icon,
  Delete02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/lib/queries/addresses";

export default function AddressesList() {
  const router = useRouter();
  const { data: addresses, isLoading } = useAddresses();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const confirmDelete = (id: number) => {
    Alert.alert("Remove address?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(id, {
            onSuccess: () => toast.success("Removed"),
            onError: () => toast.error("Could not remove"),
          });
        },
      },
    ]);
  };

  const onSetDefault = (id: number) => {
    setDefaultMutation.mutate(id, {
      onSuccess: () => toast.success("Default updated"),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand">Addresses</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      ) : !addresses || addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-50">
            <HugeiconsIcon icon={Location01Icon} size={40} color="#0A0A0A" />
          </View>
          <Text variant="bold" className="mt-4 text-lg text-brand">No addresses yet</Text>
          <Text className="mt-1 text-center text-sm" style={{ color: "#6B7280" }}>
            Add an address for fast checkout
          </Text>
          <View className="mt-6 w-full">
            <Button
              label="Add Address"
              onPress={() => router.push("/addresses/new" as any)}
              fullWidth
              size="lg"
              leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />}
            />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {addresses.map((a, i) => (
              <Animated.View
                key={a.id}
                entering={FadeInUp.duration(400).delay(i * 50)}
                className="mb-3 rounded-md bg-white p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text variant="bold" className="text-base text-brand">{a.label}</Text>
                    {a.is_default ? (
                      <View className="rounded-full bg-brand px-2 py-0.5">
                        <Text variant="semibold" style={{ color: "#fff", fontSize: 10 }}>
                          Default
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => router.push(`/addresses/${a.id}` as any)}
                      hitSlop={6}
                    >
                      <HugeiconsIcon icon={Edit02Icon} size={18} color="#0A0A0A" />
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(a.id)} hitSlop={6}>
                      <HugeiconsIcon icon={Delete02Icon} size={18} color="#FF4D4F" />
                    </Pressable>
                  </View>
                </View>
                <Text variant="semibold" className="mt-2 text-sm text-brand">
                  {a.recipient_name}
                </Text>
                <Text className="text-sm" style={{ color: "#6B7280" }}>{a.phone}</Text>
                <Text className="mt-1 text-sm" style={{ color: "#374151" }}>
                  {a.address_line}, {a.city}
                  {a.building ? `, Bldg ${a.building}` : ""}
                  {a.floor ? `, Fl ${a.floor}` : ""}
                  {a.apartment ? `, Apt ${a.apartment}` : ""}
                </Text>
                {!a.is_default ? (
                  <Pressable
                    onPress={() => onSetDefault(a.id)}
                    className="mt-3 flex-row items-center gap-1.5 self-start"
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={14} color="#0A0A0A" />
                    <Text variant="medium" className="text-xs text-brand">
                      Set as default
                    </Text>
                  </Pressable>
                ) : null}
              </Animated.View>
            ))}
          </ScrollView>

          <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 bg-white">
            <View className="border-t border-brand-100 px-6 py-3">
              <Button
                label="Add New Address"
                onPress={() => router.push("/addresses/new" as any)}
                fullWidth
                size="lg"
                leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />}
              />
            </View>
          </SafeAreaView>
        </>
      )}
    </SafeAreaView>
  );
}