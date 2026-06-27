import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { I18nManager } from "react-native";
import i18n from "@/lib/i18n";

export type Language = "en" | "ar";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "ar",
  setLanguage: async (lang) => {
    await SecureStore.setItemAsync("app_language", lang);
    await i18n.changeLanguage(lang);
    const shouldBeRTL = lang === "ar";
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    set({ language: lang });
  },
  hydrate: async () => {
    const stored = (await SecureStore.getItemAsync("app_language")) as Language | null;
    const lang = stored ?? "ar";
    await i18n.changeLanguage(lang);
    const shouldBeRTL = lang === "ar";
    I18nManager.allowRTL(shouldBeRTL);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
    }
    set({ language: lang });
  },
}));
