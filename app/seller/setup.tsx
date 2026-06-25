import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Animated, { FadeInRight } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Location01Icon,
  ImageUpload01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import MapView, { type Region, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import type { WorkingHours } from "@/lib/queries/seller";
import { useCreateStore, useUpdateStore, useSellerStore } from "@/lib/queries/seller";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";
import { API_URL } from "@/lib/api";

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

async function uploadStoreImage(
  localUri: string,
  onLoading: (b: boolean) => void
): Promise<string> {
  onLoading(true);
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    const upload = await FileSystem.uploadAsync(
      `${API_URL}/seller/upload/image`,
      localUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "image",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      }
    );
    const json = JSON.parse(upload.body);
    if (upload.status >= 400) { throw new Error(json?.message ?? "Upload failed"); }
    return json.data.url as string;
  } finally {
    onLoading(false);
  }
}

export default function SellerSetup() {
  const router = useRouter();
  const c = useThemeColors();
  const { data: existingStore } = useSellerStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const isEditing = !!existingStore;
  const TOTAL_STEPS = 4;

  const [step, setStep] = useState(0);

  // Step 1 — location
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    existingStore?.latitude && existingStore?.longitude
      ? { latitude: Number(existingStore.latitude), longitude: Number(existingStore.longitude) }
      : null
  );
  const [city, setCity] = useState(existingStore?.city ?? "");
  const [address, setAddress] = useState(existingStore?.address ?? "");
  const [gpsLoading, setGpsLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Step 2 — images
  const [logoUri, setLogoUri] = useState<string | null>(existingStore?.logo ?? null);
  const [logoUrl, setLogoUrl] = useState<string | null>(existingStore?.logo ?? null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [bannerUri, setBannerUri] = useState<string | null>(existingStore?.banner ?? null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(existingStore?.banner ?? null);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Step 3 — hours
  const [hours, setHours] = useState<WorkingHours>(existingStore?.working_hours ?? DEFAULT_HOURS);

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
      if (place?.city) { setCity(place.city); }
      if (place?.street) { setAddress(place.street); }
    } catch {
      toast.error("Could not detect location");
    } finally {
      setGpsLoading(false);
    }
  };

  const onMapRegionChange = (region: Region) => {
    setCoords({ latitude: region.latitude, longitude: region.longitude });
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { toast.error("Media permission denied"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) { return; }
    const uri = result.assets[0].uri;
    setLogoUri(uri);
    setLogoUrl(null);
    try {
      const url = await uploadStoreImage(uri, setLogoLoading);
      setLogoUrl(url);
    } catch (e: any) {
      toast.error(e?.message ?? "Logo upload failed");
      setLogoUri(null);
    }
  };

  const pickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { toast.error("Media permission denied"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 5],
      quality: 0.85,
    });
    if (result.canceled) { return; }
    const uri = result.assets[0].uri;
    setBannerUri(uri);
    setBannerUrl(null);
    try {
      const url = await uploadStoreImage(uri, setBannerLoading);
      setBannerUrl(url);
    } catch (e: any) {
      toast.error(e?.message ?? "Banner upload failed");
      setBannerUri(null);
    }
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
      logo: logoUrl ?? undefined,
      banner: bannerUrl ?? undefined,
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
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-6 py-4">
          <Pressable onPress={() => (step > 0 ? setStep(step - 1) : router.back())}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
          </Pressable>
          <Text variant="bold" className="flex-1 text-xl text-brand">
            {isEditing ? "Edit Store" : "Set Up Store"}
          </Text>
          <Text className="text-sm" style={{ color: c.secondary }}>{step + 1} / {TOTAL_STEPS}</Text>
        </View>

        {/* Progress */}
        <View className="flex-row gap-1 px-6 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i <= step ? c.brand : c.border }}
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
                      className="rounded-xl border border-brand-100 dark:border-[#2A2A2A] bg-white dark:bg-bg-card px-4 py-3 text-sm text-brand dark:text-white"
                      style={{ minHeight: 100, textAlignVertical: "top" }}
                      placeholderTextColor={c.placeholder}
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
              <Text className="text-sm" style={{ color: c.secondary }}>
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
                className="flex-row items-center gap-2 self-start rounded-lg bg-white dark:bg-bg-card px-4 py-2.5"
              >
                {gpsLoading ? (
                  <Spinner size={18} strokeWidth={2} />
                ) : (
                  <HugeiconsIcon icon={Location01Icon} size={18} color={c.brand} />
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
                className="flex-1 items-center rounded-xl border border-brand-100 dark:border-[#2A2A2A] py-4"
              >
                <Text variant="bold" className="text-brand">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(2)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
              >
                <Text variant="bold" style={{ color: "#fff" }}>Next: Images</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Step 2 — Images */}
        {step === 2 ? (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View>
                <Text variant="bold" className="text-lg text-brand">Store images</Text>
                <Text className="mt-1 text-sm" style={{ color: c.secondary }}>
                  Optional — you can add or update these later.
                </Text>
              </View>

              {/* Logo */}
              <View className="gap-2">
                <Text variant="medium" className="text-sm text-brand">Store logo</Text>
                <View className="flex-row items-center gap-4">
                  <Pressable onPress={pickLogo} disabled={logoLoading}>
                    <View
                      className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-bg-card"
                      style={{
                        borderWidth: 2,
                        borderColor: logoUrl ? c.brand : c.border,
                        borderStyle: "dashed",
                      }}
                    >
                      {logoUri ? (
                        <>
                          <Image
                            source={{ uri: logoUri }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                          {logoLoading ? (
                            <View
                              className="absolute inset-0 items-center justify-center rounded-2xl"
                              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                            >
                              <Spinner size={24} color="#fff" trackColor="rgba(255,255,255,0.3)" strokeWidth={2} />
                            </View>
                          ) : null}
                        </>
                      ) : (
                        <HugeiconsIcon icon={ImageUpload01Icon} size={28} color="#D1D5DB" />
                      )}
                    </View>
                  </Pressable>
                  <View className="flex-1 gap-1">
                    <Text variant="medium" className="text-sm text-brand">
                      {logoLoading ? "Uploading…" : logoUrl ? "Logo uploaded" : "Tap to upload"}
                    </Text>
                    <Text className="text-xs" style={{ color: c.muted }}>
                      Square image · JPG, PNG, WebP
                    </Text>
                  </View>
                </View>
              </View>

              {/* Banner */}
              <View className="gap-2">
                <Text variant="medium" className="text-sm text-brand">Store banner</Text>
                <Pressable onPress={pickBanner} disabled={bannerLoading}>
                  <View
                    className="w-full items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-bg-card"
                    style={{
                      height: 140,
                      borderWidth: 2,
                      borderColor: bannerUrl ? c.brand : c.border,
                      borderStyle: "dashed",
                    }}
                  >
                    {bannerUri ? (
                      <>
                        <Image
                          source={{ uri: bannerUri }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        {bannerLoading ? (
                          <View
                            className="absolute inset-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                          >
                            <Spinner size={36} color="#fff" trackColor="rgba(255,255,255,0.3)" strokeWidth={3} />
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <View className="items-center gap-2">
                        <HugeiconsIcon icon={ImageUpload01Icon} size={32} color="#D1D5DB" />
                        <Text className="text-sm" style={{ color: c.muted }}>
                          {bannerLoading ? "Uploading…" : "Tap to upload banner"}
                        </Text>
                        <Text className="text-xs" style={{ color: c.border }}>
                          Landscape · 16:5 ratio recommended
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
                {bannerUrl ? (
                  <Text className="text-xs" style={{ color: c.secondary }}>Banner uploaded</Text>
                ) : null}
              </View>
            </ScrollView>

            <View className="flex-row gap-3 px-6 pb-8 pt-4">
              <Pressable
                onPress={() => setStep(1)}
                className="flex-1 items-center rounded-xl border border-brand-100 dark:border-[#2A2A2A] py-4"
              >
                <Text variant="bold" className="text-brand">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(3)}
                disabled={logoLoading || bannerLoading}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
                style={{ opacity: logoLoading || bannerLoading ? 0.6 : 1 }}
              >
                <Text variant="bold" style={{ color: "#fff" }}>Next: Hours</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Step 3 — Working hours */}
        {step === 3 ? (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 4 }}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="bold" className="mb-2 text-lg text-brand">Working hours</Text>

              {DAYS.map((day) => {
                const h = hours[day];
                return (
                  <View key={day} className="rounded-xl bg-white dark:bg-bg-card px-4 py-3 mb-2">
                    <View className="flex-row items-center">
                      <Text variant="semibold" className="flex-1 text-sm text-brand capitalize">
                        {DAY_LABELS[day]}
                      </Text>
                      <Switch
                        value={h.open}
                        onValueChange={(val) => setDayOpen(day, val)}
                        trackColor={{ false: c.border, true: c.brand }}
                        thumbColor="#fff"
                      />
                    </View>

                    {h.open ? (
                      <View className="mt-3 flex-row gap-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-xs" style={{ color: c.secondary }}>From</Text>
                          <TextInput
                            value={h.from}
                            onChangeText={(val) => setDayTime(day, "from", val)}
                            placeholder="09:00"
                            className="rounded-lg border border-brand-100 dark:border-[#2A2A2A] bg-bg-light dark:bg-[#2A2A2A] px-3 py-2 text-sm text-brand dark:text-white"
                            placeholderTextColor={c.placeholder}
                          />
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="text-xs" style={{ color: c.secondary }}>To</Text>
                          <TextInput
                            value={h.to}
                            onChangeText={(val) => setDayTime(day, "to", val)}
                            placeholder="22:00"
                            className="rounded-lg border border-brand-100 dark:border-[#2A2A2A] bg-bg-light dark:bg-[#2A2A2A] px-3 py-2 text-sm text-brand dark:text-white"
                            placeholderTextColor={c.placeholder}
                          />
                        </View>
                      </View>
                    ) : (
                      <Text className="mt-1 text-xs" style={{ color: c.muted }}>Closed</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View className="flex-row gap-3 px-6 pb-8 pt-4">
              <Pressable
                onPress={() => setStep(2)}
                className="flex-1 items-center rounded-xl border border-brand-100 dark:border-[#2A2A2A] py-4"
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
                  <Spinner size={20} color="#fff" trackColor="rgba(255,255,255,0.3)" strokeWidth={2} />
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
