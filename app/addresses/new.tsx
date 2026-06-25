import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { AddressForm } from "@/components/address-form";
import { useCreateAddress } from "@/lib/queries/addresses";
import type { AddressInput } from "@/lib/queries/addresses";

export default function NewAddress() {
  const router = useRouter();
  const { t } = useTranslation();
  const createMutation = useCreateAddress();

  const handleSave = (data: AddressInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t("addresses.toastSaved"));
        router.back();
      },
      onError: () => toast.error(t("addresses.toastSaveError")),
    });
  };

  return (
    <AddressForm
      title={t("addresses.newTitle")}
      onSave={handleSave}
      isSaving={createMutation.isPending}
    />
  );
}
