import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { toast } from "sonner-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Mail01Icon, ArrowLeft01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post("/auth/forgot-password", data);
      return data.email;
    },
    onSuccess: (email) => {
      setSentEmail(email);
      setSent(true);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light">
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View entering={FadeInDown.duration(500)} className="items-center gap-5">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-white">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={48} color="#0A0A0A" />
            </View>

            <View className="items-center gap-2">
              <Text variant="bold" className="text-center text-2xl text-brand">
                Check your email
              </Text>
              <Text className="text-center text-sm leading-5" style={{ color: "#6B7280" }}>
                We sent a password reset link to
              </Text>
              <Text variant="semibold" className="text-center text-sm text-brand">
                {sentEmail}
              </Text>
            </View>

            <Button
              label="Back to sign in"
              onPress={() => router.replace("/(auth)/sign-in" as any)}
              variant="outline"
              fullWidth
              size="lg"
            />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="absolute bottom-10 items-center"
          >
            <Text className="text-xs text-center leading-4" style={{ color: "#9CA3AF" }}>
              Didn't get it? Check your spam folder.{"\n"}The link expires in 60 minutes.
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-8">
            <Animated.View entering={FadeInDown.duration(600).springify()} className="mb-10">
              <Button
                label="Back"
                variant="ghost"
                size="sm"
                onPress={() => router.back()}
                leftIcon={<HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#0A0A0A" />}
                className="self-start -ml-2 mb-6"
              />
              <Text variant="bold" className="text-4xl text-brand">
                Forgot password?
              </Text>
              <Text className="mt-2 text-base" style={{ color: "#6B7280" }}>
                Enter your email and we'll send you a reset link.
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(700).delay(150).springify()}
              className="gap-4"
            >
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    leftIcon={<HugeiconsIcon icon={Mail01Icon} size={22} color="#0A0A0A" />}
                  />
                )}
              />

              <Button
                label="Send reset link"
                onPress={handleSubmit((data) => mutation.mutate(data))}
                loading={mutation.isPending}
                fullWidth
                size="lg"
                className="mt-2"
              />
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
