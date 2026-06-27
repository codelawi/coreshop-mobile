import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Location01Icon, MapsLocation02Icon } from "@hugeicons/core-free-icons";
import { LocationSuccessOverlay } from "@/components/ui/location-success-overlay";
import * as Location from "expo-location";
import MapboxGL from "@rnmapbox/maps";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

// Amman, Jordan default [lng, lat]
const DEFAULT_CENTER: [number, number] = [35.9106, 31.9539];

export default function LocationStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const { setLocation } = useOnboardingStore();
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState("");
  const [locationSuccess, setLocationSuccess] = useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error("Location permission required");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newCoords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCoords(newCoords);
      cameraRef.current?.setCamera({
        centerCoordinate: [newCoords.lng, newCoords.lat],
        zoomLevel: 15,
        animationDuration: 800,
      });
      await updateCityFromCoords(newCoords.lat, newCoords.lng);
      setLocationSuccess(true);
      setTimeout(() => setLocationSuccess(false), 1500);
    } catch {
      toast.error("Could not get location");
    } finally {
      setLoading(false);
    }
  };

  const updateCityFromCoords = async (lat: number, lng: number) => {
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      setCity(geo?.city ?? geo?.subregion ?? geo?.region ?? "Unknown");
    } catch {
      setCity("Unknown");
    }
  };

  const onMapIdle = (state: any) => {
    const [lng, lat] = state.properties.center;
    setCoords({ lat, lng });
    updateCityFromCoords(lat, lng);
  };

  const onNext = () => {
    if (!coords) {
      toast.error("Please set your location on the map");
      return;
    }
    setLocation(city, coords.lat, coords.lng);
    router.push("/(onboarding)/permissions" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 px-6 pt-4">
        <ProgressBar current={3} total={5} />

        <Animated.View entering={FadeInDown.duration(500).springify()} className="mt-6">
          <Text variant="bold" className="text-3xl text-brand dark:text-white">
            {t("onboarding.location.title")}
          </Text>
          <Text className="mt-2 text-base" style={{ color: c.secondary }}>
            {t("onboarding.location.dragToPin")}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(600).delay(150)}
          className="mt-6 flex-1 overflow-hidden rounded-md border border-brand-100 dark:border-[#2A2A2A]"
        >
          <MapboxGL.MapView
            style={{ flex: 1 }}
            onMapIdle={onMapIdle}
            logoEnabled={false}
            attributionEnabled={false}
            scaleBarEnabled={false}
          >
            <MapboxGL.Camera
              ref={cameraRef}
              zoomLevel={13}
              centerCoordinate={DEFAULT_CENTER}
              animationDuration={0}
            />
            <MapboxGL.UserLocation visible />
          </MapboxGL.MapView>

          {/* Fixed center pin */}
          <View
            pointerEvents="none"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
          >
            <View style={{ marginBottom: 28 }}>
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand">
                <HugeiconsIcon icon={Location01Icon} size={24} color="#fff" />
              </View>
            </View>
          </View>

          {/* GPS button */}
          <Pressable
            onPress={detectLocation}
            className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-bg-card shadow"
          >
            <HugeiconsIcon icon={MapsLocation02Icon} size={20} color={c.brand} />
          </Pressable>

          {loading && (
            <View className="absolute inset-0 items-center justify-center bg-white/70 dark:bg-black/70">
              <Spinner size={40} />
              <Text className="mt-3 text-sm text-brand dark:text-white">
                {t("onboarding.location.detectingLocation")}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          className="mt-4 flex-row items-center gap-3 rounded-md border border-brand-100 dark:border-[#2A2A2A] bg-white dark:bg-bg-card px-4 py-3"
        >
          <HugeiconsIcon icon={Location01Icon} size={22} color={c.brand} />
          <View className="flex-1">
            <Text variant="medium" className="text-xs" style={{ color: c.secondary }}>
              {t("onboarding.location.city")}
            </Text>
            <Text variant="semibold" className="text-base text-brand dark:text-white">
              {city || "—"}
            </Text>
          </View>
        </Animated.View>

        <LocationSuccessOverlay visible={locationSuccess} />

        <Animated.View entering={FadeInUp.duration(600).delay(400)} className="pb-4 pt-4">
          <Button
            label={t("common.next")}
            onPress={onNext}
            fullWidth
            size="lg"
            disabled={loading || !coords}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
