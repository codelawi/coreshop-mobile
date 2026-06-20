import { useRouter } from "expo-router";
import { toast } from "sonner-native";

import { AddressForm } from "@/components/address-form";
import { useCreateAddress } from "@/lib/queries/addresses";
import type { AddressInput } from "@/lib/queries/addresses";

export default function NewAddress() {
  const router = useRouter();
  const createMutation = useCreateAddress();

  const handleSave = (data: AddressInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Address saved");
        router.back();
      },
      onError: () => toast.error("Could not save address"),
    });
  };

  return (
    <AddressForm
      title="New Address"
      onSave={handleSave}
      isSaving={createMutation.isPending}
    />
  );
}
