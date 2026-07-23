import "react-native-gesture-handler";
import "../global.css";
import "@/lib/i18n";
import { Stack } from "expo-router";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { useEffect, useState } from "react";
import { Toaster } from "sonner-native";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useThemeStore } from "@/stores/theme-store";
import { useNotifPrefsStore } from "@/stores/notif-prefs-store";
import { useSavedAccountsStore } from "@/stores/saved-accounts-store";
import { useColorScheme } from "nativewind";
import { registerForPushNotifications, setupNotificationListeners, ensureNotificationChannel } from "@/lib/notifications";
import { OfflineBanner } from "@/components/ui/offline-banner";

export default function RootLayout() {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateLang = useLanguageStore((s) => s.hydrate);
  const hydrateCart = useCartStore((s) => s.hydrate);
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateNotifPrefs = useNotifPrefsStore((s) => s.hydrate);
  const hydrateSavedAccounts = useSavedAccountsStore((s) => s.hydrate);
  const themeMode = useThemeStore((s) => s.mode);
  const { colorScheme, setColorScheme } = useColorScheme();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([hydrateAuth(), hydrateLang(), hydrateCart(), hydrateWishlist(), hydrateTheme(), hydrateNotifPrefs(), hydrateSavedAccounts()]).then(
      () => setHydrated(true)
    );
  }, [hydrateAuth, hydrateLang, hydrateCart, hydrateWishlist, hydrateTheme, hydrateNotifPrefs, hydrateSavedAccounts]);

  useEffect(() => {
    setColorScheme(themeMode);
  }, [themeMode, setColorScheme]);

  // Register push token whenever the user is authenticated
  useEffect(() => {
    if (token) {
      registerForPushNotifications();
    }
  }, [token]);

  // Ensure the Android notification channel exists with correct importance on every app open.
  // This runs independently of auth so the channel is ready before any push arrives.
  useEffect(() => {
    void ensureNotificationChannel();
  }, []);

  // Set up notification tap listener for the lifetime of the app
  useEffect(() => {
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  if (!loaded || !hydrated) {
    return <View className="flex-1 bg-bg-light dark:bg-bg-dark" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false }} />
          <Toaster position="top-center" />
          <OfflineBanner />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
