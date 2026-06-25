import { useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { AddressForm } from "@/components/address-form";
import { useAddresses, useUpdateAddress } from "@/lib/queries/addresses";
import type { AddressInput } from "@/lib/queries/addresses";
import { Spinner } from "@/components/ui/spinner";

export default function EditAddress() {
  const router = useRouter();
  const { t } = useTranslation();
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
      <View className="flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size={44} />
      </View>
    );
  }

  const handleSave = (data: AddressInput) => {
    updateMutation.mutate(
      { id: Number(id), data },
      {
        onSuccess: () => {
          toast.success(t("addresses.toastUpdated"));
          router.back();
        },
        onError: () => toast.error(t("addresses.toastUpdateError")),
      },
    );
  };

  return (
    <AddressForm
      title={t("addresses.editTitle")}
      initialAddress={address}
      onSave={handleSave}
      isSaving={updateMutation.isPending}
    />
  );
}
