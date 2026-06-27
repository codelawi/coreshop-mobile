import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Location01Icon,
  MapsLocation02Icon,
} from "@hugeicons/core-free-icons";
import { LocationSuccessOverlay } from "@/components/ui/location-success-overlay";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";
import type { Address, AddressInput } from "@/lib/queries/addresses";

// Amman, Jordan [lng, lat]
const DEFAULT_CENTER: [number, number] = [35.9106, 31.9539];

const schema = z.object({
  label: z.string().optional(),
  recipient_name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  address_line: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  notes: z.string().optional(),
  is_default: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  title: string;
  initialAddress?: Address;
  onSave: (data: AddressInput) => void;
  isSaving: boolean;
}

export function AddressForm({ title, initialAddress, onSave, isSaving }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const [locationSuccess, setLocationSuccess] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialAddress
      ? {
          lat: parseFloat(initialAddress.latitude),
          lng: parseFloat(initialAddress.longitude),
        }
      : null,
  );
  const [city, setCity] = useState(initialAddress?.city ?? "");
  const [mapLoading, setMapLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: initialAddress?.label ?? "",
      recipient_name: initialAddress?.recipient_name ?? "",
      phone: initialAddress?.phone ?? "",
      address_line: initialAddress?.address_line ?? "",
      building: initialAddress?.building ?? "",
      floor: initialAddress?.floor ?? "",
      apartment: initialAddress?.apartment ?? "",
      notes: initialAddress?.notes ?? "",
      is_default: initialAddress?.is_default ?? false,
    },
  });

  useEffect(() => {
    if (!initialAddress) {
      detectGPS();
    }
  }, []);

  const detectGPS = async () => {
    setMapLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error(t("addresses.form.locationRequired"));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newCoords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCoords(newCoords);
      cameraRef.current?.setCamera({
        centerCoordinate: [newCoords.lng, newCoords.lat],
        zoomLevel: 16,
        animationDuration: 800,
      });
      await reverseGeocode(newCoords.lat, newCoords.lng);
      setLocationSuccess(true);
      setTimeout(() => setLocationSuccess(false), 1500);
    } catch {
      toast.error(t("addresses.form.couldNotGetLocation"));
    } finally {
      setMapLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      setCity(geo?.city ?? geo?.subregion ?? geo?.region ?? "");
    } catch {
      // ignore
    }
  };

  const onMapIdle = async (state: any) => {
    const [lng, lat] = state.properties.center;
    setCoords({ lat, lng });
    await reverseGeocode(lat, lng);
  };

  const onSubmit = (formData: FormData) => {
    if (!coords) {
      toast.error(t("addresses.form.pinRequired"));
      return;
    }
    onSave({
      label: formData.label || "Home",
      recipient_name: formData.recipient_name,
      phone: formData.phone,
      address_line: formData.address_line || "",
      city: city || "Unknown",
      latitude: coords.lat,
      longitude: coords.lng,
      building: formData.building || null,
      floor: formData.floor || null,
      apartment: formData.apartment || null,
      notes: formData.notes || null,
      is_default: formData.is_default,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">
          {title}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Map picker */}
          <View className="h-64 overflow-hidden border-b border-brand-100 dark:border-[#2A2A2A]">
            <MapboxGL.MapView
              style={{ flex: 1 }}
              onMapIdle={onMapIdle}
              logoEnabled={false}
              attributionEnabled={false}
              scaleBarEnabled={false}
            >
              <MapboxGL.Camera
                ref={cameraRef}
                zoomLevel={coords ? 16 : 13}
                centerCoordinate={
                  coords ? [coords.lng, coords.lat] : DEFAULT_CENTER
                }
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
              onPress={detectGPS}
              className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-bg-card shadow"
            >
              <HugeiconsIcon icon={MapsLocation02Icon} size={20} color={c.brand} />
            </Pressable>

            {mapLoading && (
              <View className="absolute inset-0 items-center justify-center bg-white/70 dark:bg-black/70">
                <Spinner size={40} />
              </View>
            )}
          </View>

          {/* Detected city */}
          <View className="flex-row items-center gap-2 border-b border-brand-100 dark:border-[#2A2A2A] bg-white dark:bg-bg-card px-4 py-3">
            <HugeiconsIcon icon={Location01Icon} size={16} color={c.secondary} />
            <Text className="text-sm" style={{ color: c.secondary }}>
              {t("addresses.form.cityLabel")}
            </Text>
            <Text variant="semibold" className="text-sm text-brand dark:text-white">
              {city || t("addresses.form.dragToDetect")}
            </Text>
          </View>
          <LocationSuccessOverlay visible={locationSuccess} />

          {/* Form fields */}
          <View className="gap-4 px-4 pt-5">
            <Controller
              control={control}
              name="label"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t("addresses.form.labelField")}
                  placeholder={t("addresses.form.labelPlaceholder")}
                  value={value ?? ""}
                  onChangeText={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="recipient_name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t("addresses.form.recipientName")}
                  placeholder={t("addresses.form.recipientPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  error={errors.recipient_name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t("addresses.form.phone")}
                  placeholder={t("addresses.form.phonePlaceholder")}
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="address_line"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t("addresses.form.streetAddress")}
                  placeholder={t("addresses.form.streetPlaceholder")}
                  value={value ?? ""}
                  onChangeText={onChange}
                />
              )}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="building"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t("addresses.form.building")}
                      placeholder={t("addresses.form.optional")}
                      value={value ?? ""}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="floor"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t("addresses.form.floor")}
                      placeholder={t("addresses.form.optional")}
                      value={value ?? ""}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="apartment"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t("addresses.form.apt")}
                      placeholder={t("addresses.form.optional")}
                      value={value ?? ""}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t("addresses.form.notes")}
                  placeholder={t("addresses.form.notesPlaceholder")}
                  value={value ?? ""}
                  onChangeText={onChange}
                />
              )}
            />

            {/* Default toggle */}
            <Controller
              control={control}
              name="is_default"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center justify-between rounded-md border border-brand-100 dark:border-[#3A3A3A] bg-white dark:bg-bg-card px-4 py-4">
                  <Text variant="medium" className="text-sm text-brand dark:text-white">
                    {t("addresses.form.setAsDefault")}
                  </Text>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: c.border, true: c.brand }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={c.border}
                  />
                </View>
              )}
            />

            <Button
              label={t("addresses.form.saveAddress")}
              onPress={handleSubmit(onSubmit)}
              loading={isSaving}
              fullWidth
              size="lg"
              className="mt-2"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
