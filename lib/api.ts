import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useNetworkStore } from "@/stores/network-store";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://coreshop.io/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // SecureStore unavailable on this device, proceed without token
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    useNetworkStore.getState().setOffline(false);
    return res;
  },
  async (error) => {
    if (!error.response) {
      // No response = no internet or server unreachable
      useNetworkStore.getState().setOffline(true);
    } else {
      useNetworkStore.getState().setOffline(false);
      if (error.response.status === 401) {
        await SecureStore.deleteItemAsync("auth_token");
      }
    }
    return Promise.reject(error);
  }
);