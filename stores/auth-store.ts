import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "@/lib/api";

export type Role = "client" | "seller" | "driver" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive" | "suspended";
  avatar?: string | null;
  email_verified_at?: string | null;
  onboarding_completed?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("auth_token", token);
    set({ user, token, isLoading: false });
  },
  setUser: (user) => set({ user }),
  logout: async () => {
    await SecureStore.deleteItemAsync("auth_token");
    set({ user: null, token: null, isLoading: false });
  },
  hydrate: async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (!token) {
      set({ token: null, user: null, isLoading: false });
      return;
    }
    try {
      const res = await api.get("/auth/me");
      set({ token, user: res.data.data, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync("auth_token");
      set({ token: null, user: null, isLoading: false });
    }
  },
}));