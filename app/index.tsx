import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";

export default function Index() {
  const { token, user } = useAuthStore();

  if (!token || !user) return <Redirect href={"/(auth)/sign-in" as any} />;

  if (user.role !== "admin" && !user.onboarding_completed) {
    return <Redirect href={"/(onboarding)/avatar" as any} />;
  }

  return <Redirect href={"/(tabs)/home" as any} />;
}