import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";

export default function Index() {
  const { token, user, isGuest } = useAuthStore();

  if (!token || !user) {
    if (isGuest) return <Redirect href={"/(tabs)/home" as any} />;
    return <Redirect href={"/(auth)/sign-in" as any} />;
  }

  if (user.status === "suspended") {
    return <Redirect href={"/banned" as any} />;
  }

  if (!user.email_verified_at) {
    return <Redirect href={"/(auth)/verify-email" as any} />;
  }

  if (user.role !== "admin" && !user.onboarding_completed) {
    return <Redirect href={"/(onboarding)/avatar" as any} />;
  }

  return <Redirect href={"/(tabs)/home" as any} />;
}