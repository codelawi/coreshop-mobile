import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, StarIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { useSubmitReview, useOrderReviewStatus } from "@/lib/queries/orders";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const id = Number(orderId);

  const { data: reviewStatus, isLoading } = useOrderReviewStatus(id);
  const submitMutation = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    submitMutation.mutate(
      { orderId: id, rating, comment },
      {
        onSuccess: () => {
          toast.success("Review submitted!");
          router.back();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message ?? "Could not submit review");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size={44} />
      </SafeAreaView>
    );
  }

  // Already reviewed — show submitted state
  if (reviewStatus?.reviewed) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
          </Pressable>
          <Text variant="bold" className="text-xl text-brand dark:text-white">Review</Text>
        </View>

        <View className="flex-1 items-center justify-center px-8 gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand">
            <HugeiconsIcon icon={Tick02Icon} size={36} color="#fff" />
          </View>
          <Text variant="bold" className="text-xl text-brand dark:text-white">Already reviewed</Text>
          <View className="flex-row gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <HugeiconsIcon
                key={s}
                icon={StarIcon}
                size={28}
                color={s <= (reviewStatus.rating ?? 0) ? "#F59E0B" : c.border}
              />
            ))}
          </View>
          {reviewStatus.comment ? (
            <Text className="text-center text-sm leading-5" style={{ color: c.secondary }}>
              "{reviewStatus.comment}"
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">Leave a Review</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Star picker */}
          <Animated.View entering={FadeInDown.duration(400)} className="mt-6 items-center gap-4">
            <Text variant="semibold" className="text-base text-brand dark:text-white">
              How was your experience?
            </Text>

            <View className="flex-row gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setRating(s)} hitSlop={6}>
                  <HugeiconsIcon
                    icon={StarIcon}
                    size={48}
                    color={s <= rating ? "#F59E0B" : c.border}
                  />
                </Pressable>
              ))}
            </View>

            {rating > 0 ? (
              <Text variant="semibold" style={{ color: "#F59E0B", fontSize: 15 }}>
                {RATING_LABELS[rating]}
              </Text>
            ) : (
              <Text className="text-sm" style={{ color: c.muted }}>
                Tap a star to rate
              </Text>
            )}
          </Animated.View>

          {/* Comment */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)} className="mt-8 gap-2">
            <Text variant="medium" className="text-sm text-brand dark:text-white">
              Comment <Text style={{ color: c.muted }}>(optional)</Text>
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us about your order, delivery, and store..."
              placeholderTextColor={c.placeholder}
              multiline
              numberOfLines={5}
              spellCheck={false}
              autoCorrect={false}
              maxLength={1000}
              style={{
                minHeight: 120,
                textAlignVertical: "top",
                fontFamily: "Manrope_400Regular",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.inputBorder,
                backgroundColor: c.card,
                color: c.brand,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
              }}
            />
            <Text className="text-right text-xs" style={{ color: c.muted }}>
              {comment.length}/1000
            </Text>
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.duration(400).delay(160)} className="mt-6">
            <Pressable
              onPress={handleSubmit}
              disabled={submitMutation.isPending || rating === 0}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
              style={{ opacity: submitMutation.isPending || rating === 0 ? 0.5 : 1 }}
            >
              {submitMutation.isPending ? (
                <Spinner size={20} color="#fff" trackColor="rgba(255,255,255,0.3)" strokeWidth={2} />
              ) : (
                <HugeiconsIcon icon={StarIcon} size={18} color="#fff" />
              )}
              <Text variant="bold" style={{ color: "#fff" }}>Submit Review</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
