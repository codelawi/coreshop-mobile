import { useEffect, useState } from "react";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import * as SecureStore from "expo-secure-store";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

const redirectUri = makeRedirectUri({ useProxy: true });

export function useGoogleAuth() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: "token",
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === "success") {
      const accessToken =
        response.authentication?.accessToken ??
        (response.params as any)?.access_token;
      if (accessToken) {
        handleToken(accessToken);
      }
    } else if (response?.type === "error") {
      toast.error("Google sign-in failed");
    }
  }, [response]);

  const handleToken = async (accessToken: string) => {
    setLoading(true);
    try {
      const res = await api.post<{
        success: boolean;
        data: { token: string; user: any };
      }>("/auth/google", { access_token: accessToken });

      const { token, user } = res.data.data;
      await SecureStore.setItemAsync("auth_token", token);
      setAuth(user, token);

      if (!user.onboarding_completed) {
        router.replace("/(onboarding)/avatar" as any);
      } else {
        router.replace("/(tabs)/home" as any);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    ready: !!request,
    loading,
    signInWithGoogle: () => promptAsync({ useProxy: true }),
  };
}
