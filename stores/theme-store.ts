import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "light" | "dark" | "system" | "pink";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "theme_mode";

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",

  setMode: async (mode) => {
    set({ mode });
    await SecureStore.setItemAsync(STORAGE_KEY, mode);
  },

  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system" || stored === "pink") {
      set({ mode: stored });
    }
  },
}));
