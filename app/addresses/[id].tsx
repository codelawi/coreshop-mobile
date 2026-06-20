import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "sonner-native";

import { AddressForm } from "@/components/address-form";
import { useAddresses, useUpdateAddress } from "@/lib/queries/addresses";
import type { AddressInput } from "@/lib/queries/addresses";

export default function EditAddress() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: addresses, isLoading } = useAddresses();
  const updateMutation = useUpdateAddress();

  const address = addresses?.find((a) => a.id === Number(id));

  useEffect(() => {
    if (!isLoading && !address) {
      router.back();
    }
  }, [isLoading, address]);

  if (isLoading || !address) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-light">
        <ActivityIndicator color="#0A0A0A" />
      </View>
    );
  }

  const handleSave = (data: AddressInput) => {
    updateMutation.mutate(
      { id: Number(id), data },
      {
        onSuccess: () => {
          toast.success("Address updated");
          router.back();
        },
        onError: () => toast.error("Could not update address"),
      },
    );
  };

  return (
    <AddressForm
      title="Edit Address"
      initialAddress={address}
      onSave={handleSave}
      isSaving={updateMutation.isPending}
    />
  );
}
