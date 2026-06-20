import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Location01Icon,
  Tick02Icon,
  CreditCardIcon,
  DeliveryTruck02Icon,
  ShoppingCart01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useAddresses } from "@/lib/queries/addresses";
import type { Address } from "@/lib/queries/addresses";
import { useStore } from "@/lib/queries/home";
import { usePlaceOrder } from "@/lib/queries/orders";
import { api } from "@/lib/api";

interface AppliedCoupon {
  code: string;
  discount: number;
  label: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function deliveryFeeFor(distanceKm: number): number {
  return Math.round(Math.max(1.0, 1.0 + distanceKm * 0.3) * 100) / 100;
}

export default function Checkout() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const storeName = useCartStore((s) => s.storeName);
  const storeId = useCartStore((s) => s.storeId);
  const subtotal = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clear);

  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const { data: storeDetail } = useStore(storeId ?? 0);
  const placeOrderMutation = usePlaceOrder();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [notes, setNotes] = useState("");

  const activeAddress = selectedAddress ?? addresses?.find((a) => a.is_default) ?? addresses?.[0];

  const { distanceKm, deliveryFee } = useMemo(() => {
    if (!storeDetail || !activeAddress) {
      return { distanceKm: null, deliveryFee: null };
    }
    const d = haversineKm(
      parseFloat(storeDetail.latitude),
      parseFloat(storeDetail.longitude),
      parseFloat(activeAddress.latitude),
      parseFloat(activeAddress.longitude),
    );
    return { distanceKm: d, deliveryFee: deliveryFeeFor(d) };
  }, [storeDetail, activeAddress]);

  const discount = appliedCoupon?.discount ?? 0;
  const total = subtotal - discount + (deliveryFee ?? 0);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);
    setAppliedCoupon(null);

    try {
      const res = await api.get<{
        success: boolean;
        data: { code: string; discount: number; label: string };
      }>("/client/coupons/check", { params: { code, subtotal } });

      setAppliedCoupon(res.data.data);
      toast.success(`Coupon applied — ${res.data.data.label}`);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Invalid coupon";
      setCouponError(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  const onPlaceOrder = () => {
    if (!activeAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    placeOrderMutation.mutate(
      {
        address_id: activeAddress.id,
        coupon_code: appliedCoupon?.code,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
        })),
      },
      {
        onSuccess: (order) => {
          clearCart();
          toast.success("Order placed!");
          router.replace(`/orders/${order.id}` as any);
        },
        onError: (err: any) => {
          const errors = err.response?.data?.errors as Record<string, string[]> | undefined;
          const msg =
            errors?.coupon_code?.[0] ??
            errors?.items?.[0] ??
            err.response?.data?.message ??
            "Could not place order";
          toast.error(msg);
        },
      },
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light">
        <HugeiconsIcon icon={ShoppingCart01Icon} size={48} color="#D1D5DB" />
        <Text variant="semibold" className="mt-4 text-brand">Cart is empty</Text>
        <Pressable onPress={() => router.back()} className="mt-3">
          <Text className="text-sm" style={{ color: "#FF4D4F" }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand">Checkout</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 240 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Deliver to */}
          <Animated.View entering={FadeInDown.duration(400)} className="mx-4 mt-4">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
              Deliver to
            </Text>

            {addressesLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator color="#0A0A0A" />
              </View>
            ) : !activeAddress ? (
              <Pressable
                onPress={() => router.push("/addresses/new" as any)}
                className="flex-row items-center gap-3 rounded-md border border-dashed border-brand-100 bg-white p-4"
              >
                <HugeiconsIcon icon={Location01Icon} size={20} color="#9CA3AF" />
                <Text className="text-sm" style={{ color: "#9CA3AF" }}>Add a delivery address</Text>
              </Pressable>
            ) : (
              <View className="rounded-md bg-white p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 flex-row items-start gap-3">
                    <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-brand-50">
                      <HugeiconsIcon icon={Location01Icon} size={16} color="#0A0A0A" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text variant="semibold" className="text-sm text-brand">
                          {activeAddress.label}
                        </Text>
                        {activeAddress.is_default && (
                          <View className="rounded-full bg-brand px-2 py-0.5">
                            <Text style={{ color: "#fff", fontSize: 9, fontFamily: "Manrope_600SemiBold" }}>
                              Default
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text variant="medium" className="mt-0.5 text-sm text-brand">
                        {activeAddress.recipient_name}
                      </Text>
                      <Text className="mt-0.5 text-xs" style={{ color: "#6B7280" }}>
                        {activeAddress.address_line}, {activeAddress.city}
                      </Text>
                      <Text className="text-xs" style={{ color: "#9CA3AF" }}>
                        {activeAddress.phone}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setShowAddressPicker((v) => !v)} hitSlop={8} className="ml-2">
                    <Text variant="semibold" className="text-xs" style={{ color: "#FF4D4F" }}>
                      Change
                    </Text>
                  </Pressable>
                </View>

                {showAddressPicker && addresses && addresses.length > 1 && (
                  <View className="mt-3 border-t border-brand-100 pt-3">
                    {addresses
                      .filter((a) => a.id !== activeAddress.id)
                      .map((a) => (
                        <Pressable
                          key={a.id}
                          onPress={() => { setSelectedAddress(a); setShowAddressPicker(false); }}
                          className="flex-row items-center gap-3 py-2"
                        >
                          <View className="h-6 w-6 items-center justify-center rounded-full border border-brand-100">
                            <View className="h-3 w-3 rounded-full bg-brand-50" />
                          </View>
                          <View className="flex-1">
                            <Text variant="semibold" className="text-sm text-brand">{a.label}</Text>
                            <Text className="text-xs" style={{ color: "#6B7280" }}>
                              {a.address_line}, {a.city}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Order summary */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)} className="mx-4 mt-4">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
              Order from {storeName}
            </Text>
            <View className="rounded-md bg-white">
              {items.map((item, i) => (
                <View
                  key={item.id}
                  className={`flex-row gap-3 p-3 ${i < items.length - 1 ? "border-b border-brand-100" : ""}`}
                >
                  <View className="h-14 w-14 overflow-hidden rounded-md bg-brand-50">
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={{ flex: 1 }} contentFit="cover" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text variant="medium" numberOfLines={1} className="text-sm text-brand">
                      {item.name}
                    </Text>
                    {item.variant_label ? (
                      <Text className="text-xs" style={{ color: "#6B7280" }}>{item.variant_label}</Text>
                    ) : null}
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="text-xs" style={{ color: "#9CA3AF" }}>x{item.quantity}</Text>
                      <Text variant="semibold" className="text-sm text-brand">
                        JOD {(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Delivery */}
          <Animated.View entering={FadeInDown.duration(400).delay(160)} className="mx-4 mt-4">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
              Delivery
            </Text>
            <View className="flex-row items-center gap-3 rounded-md bg-white p-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                <HugeiconsIcon icon={DeliveryTruck02Icon} size={18} color="#0A0A0A" />
              </View>
              <View className="flex-1">
                <Text variant="medium" className="text-sm text-brand">Cash on Delivery</Text>
                {distanceKm != null && (
                  <Text className="text-xs" style={{ color: "#6B7280" }}>
                    ~{distanceKm.toFixed(1)} km away
                  </Text>
                )}
              </View>
              <Text variant="bold" className="text-base text-brand">
                {deliveryFee != null ? `JOD ${deliveryFee.toFixed(2)}` : "—"}
              </Text>
            </View>
          </Animated.View>

          {/* Payment */}
          <Animated.View entering={FadeInDown.duration(400).delay(220)} className="mx-4 mt-4">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
              Payment
            </Text>
            <View className="rounded-md bg-white">
              <View className="flex-row items-center gap-3 border-b border-brand-100 p-4">
                <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-brand bg-brand">
                  <HugeiconsIcon icon={Tick02Icon} size={12} color="#fff" />
                </View>
                <Text variant="semibold" className="flex-1 text-sm text-brand">Cash on Delivery</Text>
              </View>
              <View className="flex-row items-center gap-3 p-4" style={{ opacity: 0.4 }}>
                <View className="h-5 w-5 rounded-full border-2 border-brand-100" />
                <HugeiconsIcon icon={CreditCardIcon} size={18} color="#6B7280" />
                <Text variant="medium" className="flex-1 text-sm" style={{ color: "#6B7280" }}>
                  Credit / Debit Card
                </Text>
                <View className="rounded-full bg-brand-50 px-2 py-0.5">
                  <Text style={{ fontSize: 9, color: "#6B7280", fontFamily: "Manrope_600SemiBold" }}>SOON</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.duration(400).delay(280)} className="mx-4 mt-4">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
              Notes (optional)
            </Text>
            <View className="h-14 flex-row items-center rounded-md border border-brand-100 bg-white px-4">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any instructions for the seller?"
                placeholderTextColor="#9CA3AF"
                spellCheck={false}
                autoCorrect={false}
                style={{ flex: 1, fontFamily: "Manrope_400Regular", color: "#0A0A0A", fontSize: 14 }}
              />
            </View>
          </Animated.View>

          {/* Coupon */}
          <Animated.View entering={FadeInDown.duration(400).delay(320)} className="mx-4 mt-4">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
              Coupon (optional)
            </Text>

            {appliedCoupon ? (
              /* Applied state */
              <View className="flex-row items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-green-500">
                  <HugeiconsIcon icon={Tick02Icon} size={13} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text variant="semibold" className="text-sm" style={{ color: "#16A34A" }}>
                    {appliedCoupon.code}
                  </Text>
                  <Text className="text-xs" style={{ color: "#16A34A" }}>
                    {appliedCoupon.label} — saving JOD {appliedCoupon.discount.toFixed(2)}
                  </Text>
                </View>
                <Pressable onPress={removeCoupon} hitSlop={8}>
                  <HugeiconsIcon icon={Cancel01Icon} size={18} color="#6B7280" />
                </Pressable>
              </View>
            ) : (
              /* Input state */
              <View className="gap-2">
                <View className="flex-row gap-2">
                  <View
                    className="flex-1 flex-row items-center rounded-md border bg-white px-4"
                    style={{
                      borderColor: couponError ? "#FF4D4F" : "#E5E7EB",
                      height: 48,
                    }}
                  >
                    <TextInput
                      value={couponCode}
                      onChangeText={(t) => { setCouponCode(t); setCouponError(null); }}
                      placeholder="WELCOME20"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      spellCheck={false}
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={applyCoupon}
                      style={{ flex: 1, fontFamily: "Manrope_500Medium", color: "#0A0A0A", fontSize: 14 }}
                    />
                  </View>
                  <Pressable
                    onPress={applyCoupon}
                    disabled={!couponCode.trim() || couponLoading}
                    className="items-center justify-center rounded-md bg-brand px-4"
                    style={{ height: 48, opacity: !couponCode.trim() ? 0.4 : 1 }}
                  >
                    {couponLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text variant="semibold" style={{ color: "#fff", fontSize: 14 }}>Apply</Text>
                    )}
                  </Pressable>
                </View>

                {couponError && (
                  <Text variant="medium" className="text-xs" style={{ color: "#FF4D4F" }}>
                    {couponError}
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Sticky footer */}
        <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 bg-white">
          <View className="border-t border-brand-100 px-6 py-4">
            <View className="mb-1 flex-row justify-between">
              <Text className="text-sm" style={{ color: "#6B7280" }}>Subtotal</Text>
              <Text variant="medium" className="text-sm text-brand">JOD {subtotal.toFixed(2)}</Text>
            </View>
            {appliedCoupon && (
              <View className="mb-1 flex-row justify-between">
                <Text className="text-sm" style={{ color: "#16A34A" }}>
                  Discount ({appliedCoupon.code})
                </Text>
                <Text variant="medium" style={{ color: "#16A34A", fontSize: 14 }}>
                  -JOD {appliedCoupon.discount.toFixed(2)}
                </Text>
              </View>
            )}
            <View className="mb-3 flex-row justify-between">
              <Text className="text-sm" style={{ color: "#6B7280" }}>Delivery</Text>
              <Text variant="medium" className="text-sm text-brand">
                {deliveryFee != null ? `JOD ${deliveryFee.toFixed(2)}` : "—"}
              </Text>
            </View>
            <View className="mb-4 flex-row justify-between border-t border-brand-100 pt-3">
              <Text variant="bold" className="text-base text-brand">Total</Text>
              <Text variant="bold" className="text-xl text-brand">JOD {total.toFixed(2)}</Text>
            </View>
            <Button
              label="Place Order"
              onPress={onPlaceOrder}
              loading={placeOrderMutation.isPending}
              disabled={!activeAddress}
              fullWidth
              size="lg"
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
