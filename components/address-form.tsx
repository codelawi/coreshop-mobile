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
import MapView, { type Region, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";
import type { Address, AddressInput } from "@/lib/queries/addresses";

const DEFAULT_REGION: Region = {
  latitude: 31.9539,
  longitude: 35.9106,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const schema = z.object({
  label: z.string().min(1, "Label is required"),
  recipient_name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  address_line: z.string().min(1, "Required"),
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
  const c = useThemeColors();
  const mapRef = useRef<MapView>(null);

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
        toast.error("Location permission required");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newCoords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCoords(newCoords);
      mapRef.current?.animateToRegion({
        latitude: newCoords.lat,
        longitude: newCoords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      await reverseGeocode(newCoords.lat, newCoords.lng);
    } catch {
      toast.error("Could not get location");
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

  const onRegionChangeComplete = async (region: Region) => {
    const newCoords = { lat: region.latitude, lng: region.longitude };
    setCoords(newCoords);
    await reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const onSubmit = (formData: FormData) => {
    if (!coords) {
      toast.error("Please pin your location on the map");
      return;
    }
    onSave({
      ...formData,
      city: city || "Unknown",
      latitude: coords.lat,
      longitude: coords.lng,
      building: formData.building || null,
      floor: formData.floor || null,
      apartment: formData.apartment || null,
      notes: formData.notes || null,
    });
  };

  const initialRegion =
    coords
      ? {
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : DEFAULT_REGION;

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
            {Platform.OS === "ios" ? (
              <>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_DEFAULT}
                  style={{ flex: 1 }}
                  initialRegion={initialRegion}
                  onRegionChangeComplete={onRegionChangeComplete}
                  showsUserLocation
                  showsMyLocationButton={false}
                />
                <View
                  pointerEvents="none"
                  className="absolute inset-0 items-center justify-center"
                >
                  <View className="-mt-6 h-12 w-12 items-center justify-center rounded-full bg-brand">
                    <HugeiconsIcon icon={Location01Icon} size={24} color="#fff" />
                  </View>
                </View>
                {mapLoading && (
                  <View className="absolute inset-0 items-center justify-center bg-white/70 dark:bg-black/70">
                    <Spinner size={40} />
                  </View>
                )}
                <Pressable
                  onPress={detectGPS}
                  className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-bg-card shadow"
                >
                  <HugeiconsIcon icon={MapsLocation02Icon} size={20} color={c.brand} />
                </Pressable>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-4 bg-white dark:bg-bg-card px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-brand">
                  <HugeiconsIcon icon={Location01Icon} size={28} color="#fff" />
                </View>
                <View className="items-center gap-1">
                  <Text variant="semibold" className="text-sm text-brand dark:text-white">
                    {mapLoading ? "Detecting location..." : coords ? city || "Location detected" : "Tap to detect location"}
                  </Text>
                  {coords && (
                    <Text className="text-xs" style={{ color: c.secondary }}>
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={detectGPS}
                  disabled={mapLoading}
                  className="flex-row items-center gap-2 rounded-xl bg-brand px-5 py-2.5"
                >
                  {mapLoading ? (
                    <Spinner size={16} color="#fff" />
                  ) : (
                    <HugeiconsIcon icon={MapsLocation02Icon} size={16} color="#fff" />
                  )}
                  <Text variant="semibold" className="text-sm text-white">
                    {mapLoading ? "Detecting..." : "Use My Location"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Detected city */}
          <View className="flex-row items-center gap-2 border-b border-brand-100 dark:border-[#2A2A2A] bg-white dark:bg-bg-card px-4 py-3">
            <HugeiconsIcon icon={Location01Icon} size={16} color={c.secondary} />
            <Text className="text-sm" style={{ color: c.secondary }}>
              City:
            </Text>
            <Text variant="semibold" className="text-sm text-brand dark:text-white">
              {city || "Drag the map to detect"}
            </Text>
          </View>

          {/* Form fields */}
          <View className="gap-4 px-4 pt-5">
            <Controller
              control={control}
              name="label"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Label"
                  placeholder="Home, Work, etc."
                  value={value}
                  onChangeText={onChange}
                  error={errors.label?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="recipient_name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Recipient Name"
                  placeholder="Full name"
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
                  label="Phone"
                  placeholder="+962 7x xxx xxxx"
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
                  label="Street Address"
                  placeholder="Street name and number"
                  value={value}
                  onChangeText={onChange}
                  error={errors.address_line?.message}
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
                      label="Building"
                      placeholder="Optional"
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
                      label="Floor"
                      placeholder="Optional"
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
                      label="Apt"
                      placeholder="Optional"
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
                  label="Notes"
                  placeholder="Delivery instructions (optional)"
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
                    Set as default address
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
              label="Save Address"
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
