import { create } from "zustand";

export type Role = "client" | "seller" | "driver";

interface OnboardingState {
  avatar: string | null;
  name: string;
  role: Role | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  interests: string[];
  setAvatar: (v: string | null) => void;
  setName: (v: string) => void;
  setRole: (v: Role) => void;
  setLocation: (city: string, lat: number | null, lng: number | null) => void;
  setInterests: (v: string[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  avatar: null,
  name: "",
  role: null,
  city: "",
  latitude: null,
  longitude: null,
  interests: [],
  setAvatar: (v) => set({ avatar: v }),
  setName: (v) => set({ name: v }),
  setRole: (v) => set({ role: v }),
  setLocation: (city, latitude, longitude) => set({ city, latitude, longitude }),
  setInterests: (v) => set({ interests: v }),
  reset: () =>
    set({
      avatar: null,
      name: "",
      role: null,
      city: "",
      latitude: null,
      longitude: null,
      interests: [],
    }),
}));