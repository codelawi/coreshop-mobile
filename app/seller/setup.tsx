import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Location01Icon,
  MapsLocation02Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import MapView, { type Region, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import type { WorkingHours } from "@/lib/queries/seller";
import { useCreateStore, useUpdateStore, useSellerStore } from "@/lib/queries/seller";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DEFAULT_HOURS: WorkingHours = Object.fromEntries(
  DAYS.map((d) => [d, { open: d !== "friday", from: "09:00", to: "22:00" }])
);

const basicsSchema = z.object({
  name: z.string().min(2, "Store name is required"),
  description: z.string().optional(),
  phone: z.string().optional(),
  delivery_radius_km: z.coerce.number().int().min(1).max(100).optional(),
});

type BasicsForm = z.infer<typeof basicsSchema>;

export default function SellerSetup() {
  const router = useRouter();
  const { data: existingStore } = useSellerStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const isEditing = !!existingStore;

  const [step, setStep] = useState(0);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    existingStore?.latitude && existingStore?.longitude
      ? { latitude: Number(existingStore.latitude), longitude: Number(existingStore.longitude) }
      : null
  );
  const [city, setCity] = useState(existingStore?.city ?? "");
  const [address, setAddress] = useState(existingStore?.address ?? "");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [hours, setHours] = useState<WorkingHours>(existingStore?.working_hours ?? DEFAULT_HOURS);
  const mapRef = useRef<MapView>(null);

  const DEFAULT_REGION: Region = {
    latitude: coords?.latitude ?? 31.9522,
    longitude: coords?.longitude ?? 35.2332,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicsForm>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      name: existingStore?.name ?? "",
      description: existingStore?.description ?? "",
      phone: existingStore?.phone ?? "",
      delivery_radius_km: existingStore?.delivery_radius_km ?? 10,
    },
  });

  const detectGps = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error("Location permission denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setCoords({ latitude, longitude });
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place?.city) setCity(place.city);
      if (place?.street) setAddress(place.street);
    } catch {
      toast.error("Could not detect location");
    } finally {
      setGpsLoading(false);
    }
  };

  const onMapRegionChange = (region: Region) => {
    setCoords({ latitude: region.latitude, longitude: region.longitude });
  };

  const setDayOpen = (day: string, open: boolean) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], open } }));
  };

  const setDayTime = (day: string, field: "from" | "to", value: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const onSubmit = async (basics: BasicsForm) => {
    const payload = {
      ...basics,
      address: address || undefined,
      city: city || undefined,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      working_hours: hours,
    };

    try {
      if (isEditing) {
        await updateStore.mutateAsync(payload);
        toast.success("Store updated");
      } else {
        await createStore.mutateAsync(payload);
        toast.success("Store created! Pending admin review.");
      }
      router.replace("/seller" as any);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong";
      toast.error(msg);
    }
  };

  const submitting = createStore.isPending || updateStore.isPending;

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-6 py-4">
          <Pressable onPress={() => (step > 0 ? setStep(step - 1) : router.back())}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
          </Pressable>
          <Text variant="bold" className="flex-1 text-xl text-brand">
            {isEditing ? "Edit Store" : "Set Up Store"}
          </Text>
          <Text className="text-sm" style={{ color: "#6B7280" }}>{step + 1} / 3</Text>
        </View>

        {/* Progress */}
        <View className="flex-row gap-1 px-6 mb-6">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i <= step ? "#0A0A0A" : "#E5E7EB" }}
            />
          ))}
        </View>

        {/* Step 0 — Basics */}
        {step === 0 ? (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="bold" className="text-lg text-brand">Store basics</Text>

              <View className="gap-1.5">
                <Text variant="medium" className="text-sm text-brand">Store name *</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="e.g. Jordan Fashion Hub"
                      value={value}
                      onChangeText={onChange}
                      spellCheck={false}
                      autoCorrect={false}
                    />
                  )}
                />
                {errors.name ? (
                  <Text className="text-xs" style={{ color: "#FF4D4F" }}>{errors.name.message}</Text>
                ) : null}
              </View>

              <View className="gap-1.5">
                <Text variant="medium" className="text-sm text-brand">Description</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="Tell customers about your store..."
                      value={value}
                      onChangeText={onChange}
                      multiline
                      numberOfLines={4}
                      spellCheck={false}
                      autoCorrect={false}
                      className="rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand"
                      style={{ minHeight: 100, textAlignVertical: "top" }}
                      placeholderTextColor="#9CA3AF"
                    />
                  )}
                />
              </View>

              <View className="gap-1.5">
                <Text variant="medium" className="text-sm text-brand">Phone</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="+962 7X XXX XXXX"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                    />
                  )}
                />
              </View>

              <View className="gap-1.5">
                <Text variant="medium" className="text-sm text-brand">Delivery radius (km)</Text>
                <Controller
                  control={control}
                  name="delivery_radius_km"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="10"
                      value={String(value ?? "")}
                      onChangeText={onChange}
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.delivery_radius_km ? (
                  <Text className="text-xs" style={{ color: "#FF4D4F" }}>
                    {errors.delivery_radius_km.message}
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            <View className="px-6 pb-8 pt-4">
              <Pressable
                onPress={handleSubmit(() => setStep(1))}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
              >
                <Text variant="bold" style={{ color: "#fff" }}>Next: Location</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Step 1 — Location */}
        {step === 1 ? (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="bold" className="text-lg text-brand">Store location</Text>
              <Text className="text-sm" style={{ color: "#6B7280" }}>
                Pin your store on the map so clients can see how far you are.
              </Text>

              {/* Map */}
              <View className="overflow-hidden rounded-xl" style={{ height: 240 }}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_DEFAULT}
                  style={{ flex: 1 }}
                  initialRegion={DEFAULT_REGION}
                  onRegionChangeComplete={onMapRegionChange}
                />
                {/* Centered pin */}
                <View
                  className="absolute left-1/2 top-1/2 items-center"
                  style={{ marginLeft: -12, marginTop: -28 }}
                  pointerEvents="none"
                >
                  <View
                    className="h-6 w-6 rounded-full border-2 border-white"
                    style={{ backgroundColor: "#FF4D4F" }}
                  />
                  <View
                    className="w-0.5"
                    style={{ height: 10, backgroundColor: "#FF4D4F" }}
                  />
                </View>
              </View>

              <Pressable
                onPress={detectGps}
                disabled={gpsLoading}
                className="flex-row items-center gap-2 self-start rounded-lg bg-white px-4 py-2.5"
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#0A0A0A" />
                ) : (
                  <HugeiconsIcon icon={Location01Icon} size={18} color="#0A0A0A" />
                )}
                <Text variant="medium" className="text-sm text-brand">Use my location</Text>
              </Pressable>

              <View className="gap-1.5">
                <Text variant="medium" className="text-sm text-brand">City</Text>
                <Input
                  placeholder="e.g. Amman"
                  value={city}
                  onChangeText={setCity}
                  spellCheck={false}
                  autoCorrect={false}
                />
              </View>

              <View className="gap-1.5">
                <Text variant="medium" className="text-sm text-brand">Address</Text>
                <Input
                  placeholder="Street address"
                  value={address}
                  onChangeText={setAddress}
                  spellCheck={false}
                  autoCorrect={false}
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 px-6 pb-8 pt-4">
              <Pressable
                onPress={() => setStep(0)}
                className="flex-1 items-center rounded-xl border border-brand-100 py-4"
              >
                <Text variant="bold" className="text-brand">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(2)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
              >
                <Text variant="bold" style={{ color: "#fff" }}>Next: Hours</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Step 2 — Working hours */}
        {step === 2 ? (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 4 }}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="bold" className="mb-2 text-lg text-brand">Working hours</Text>

              {DAYS.map((day) => {
                const h = hours[day];
                return (
                  <View key={day} className="rounded-xl bg-white px-4 py-3 mb-2">
                    <View className="flex-row items-center">
                      <Text variant="semibold" className="flex-1 text-sm text-brand capitalize">
                        {DAY_LABELS[day]}
                      </Text>
                      <Switch
                        value={h.open}
                        onValueChange={(val) => setDayOpen(day, val)}
                        trackColor={{ false: "#E5E7EB", true: "#0A0A0A" }}
                        thumbColor="#fff"
                      />
                    </View>

                    {h.open ? (
                      <View className="mt-3 flex-row gap-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-xs" style={{ color: "#6B7280" }}>From</Text>
                          <TextInput
                            value={h.from}
                            onChangeText={(val) => setDayTime(day, "from", val)}
                            placeholder="09:00"
                            className="rounded-lg border border-brand-100 bg-bg-light px-3 py-2 text-sm text-brand"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="text-xs" style={{ color: "#6B7280" }}>To</Text>
                          <TextInput
                            value={h.to}
                            onChangeText={(val) => setDayTime(day, "to", val)}
                            placeholder="22:00"
                            className="rounded-lg border border-brand-100 bg-bg-light px-3 py-2 text-sm text-brand"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                    ) : (
                      <Text className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>Closed</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View className="flex-row gap-3 px-6 pb-8 pt-4">
              <Pressable
                onPress={() => setStep(1)}
                className="flex-1 items-center rounded-xl border border-brand-100 py-4"
              >
                <Text variant="bold" className="text-brand">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={submitting}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <HugeiconsIcon icon={Tick01Icon} size={18} color="#fff" />
                )}
                <Text variant="bold" style={{ color: "#fff" }}>
                  {isEditing ? "Save Changes" : "Create Store"}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
