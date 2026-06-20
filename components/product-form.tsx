import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Add01Icon,
  Delete02Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  Image01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/queries/home";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { api, API_URL } from "@/lib/api";
import type { SellerProduct, CreateProductInput } from "@/lib/queries/seller";

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  color_hex: z.string().optional(),
  price_adjustment: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0, "Required"),
});

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  category_id: z.coerce.number().min(1, "Select a category"),
  price: z.coerce.number().min(0.01, "Price is required"),
  original_price: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0, "Stock is required"),
  weight_grams: z.coerce.number().int().optional(),
  images: z.array(z.string()).max(7).optional(),
  variants: z.array(variantSchema).optional(),
});

export type ProductFormValues = z.infer<typeof schema>;

interface Props {
  initial?: SellerProduct;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  submitLabel: string;
}

interface UploadingImage {
  localUri: string;
  uploading: boolean;
  url?: string;
  error?: boolean;
}

export function ProductForm({ initial, onSubmit, submitLabel }: Props) {
  const { data: categories } = useCategories();
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>(
    initial?.images?.map((i) => ({ localUri: i.url, uploading: false, url: i.url })) ?? []
  );

  const flatCategories =
    categories?.flatMap((c) => [
      { id: c.id, name: c.name, indent: false },
      ...(c.children ?? []).map((ch) => ({ id: ch.id, name: ch.name, indent: true })),
    ]) ?? [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      category_id: initial?.category?.id ?? 0,
      price: initial?.price ? Number(initial.price) : undefined,
      original_price: initial?.original_price ? Number(initial.original_price) : undefined,
      stock: initial?.stock ?? 0,
      weight_grams: initial?.weight_grams ?? undefined,
      images: initial?.images?.map((i) => i.url) ?? [],
      variants:
        initial?.variants?.map((v) => ({
          size: v.size ?? "",
          color: v.color ?? "",
          color_hex: v.color_hex ?? "",
          price_adjustment: Number(v.price_adjustment),
          stock: v.stock,
        })) ?? [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants",
  });

  const selectedCategoryId = watch("category_id");
  const selectedCategory = flatCategories.find((c) => c.id === selectedCategoryId);
  const formImages = watch("images") ?? [];

  const pickAndUpload = async () => {
    if (uploadingImages.length >= 7) {
      toast.error("Maximum 7 images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 7 - uploadingImages.length,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets.length) return;

    for (const asset of result.assets) {
      let insertedIndex = -1;
      setUploadingImages((prev) => {
        insertedIndex = prev.length;
        return [...prev, { localUri: asset.uri, uploading: true }];
      });

      try {
        // Convert to JPEG — handles HEIC and any other format iOS returns
        const jpeg = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.85, format: SaveFormat.JPEG }
        );

        const token = await SecureStore.getItemAsync("auth_token");
        const upload = await FileSystem.uploadAsync(
          `${API_URL}/seller/upload/image`,
          jpeg.uri,
          {
            fieldName: "image",
            httpMethod: "POST",
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            headers: {
              Authorization: `Bearer ${token ?? ""}`,
              Accept: "application/json",
            },
            mimeType: "image/jpeg",
          }
        );

        const json = JSON.parse(upload.body);
        if (upload.status >= 400) throw { response: { data: json } };

        const s3Url = json.data.url;

        setUploadingImages((prev) =>
          prev.map((img, i) =>
            i === insertedIndex ? { ...img, uploading: false, url: s3Url } : img
          )
        );

        setValue("images", [...(watch("images") ?? []), s3Url]);
      } catch (err: any) {
        setUploadingImages((prev) =>
          prev.map((img) =>
            img.localUri === asset.uri ? { ...img, uploading: false, error: true } : img
          )
        );
        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.errors?.image?.[0] ??
          err?.message ??
          "Failed to upload image";
        toast.error(msg);
        console.error("Upload error:", JSON.stringify(err?.response?.data ?? err?.message));
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadingImages((prev) => prev.filter((_, i) => i !== index));
    setValue(
      "images",
      formImages.filter((_, i) => i !== index)
    );
  };

  const submit = async (values: ProductFormValues) => {
    if (uploadingImages.some((img) => img.uploading)) {
      toast.error("Please wait for images to finish uploading");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name,
        description: values.description || undefined,
        category_id: values.category_id,
        price: values.price,
        original_price: values.original_price || undefined,
        stock: values.stock,
        weight_grams: values.weight_grams || undefined,
        images: values.images?.filter(Boolean),
        variants: values.variants?.length
          ? values.variants.map((v) => ({
              size: v.size || undefined,
              color: v.color || undefined,
              color_hex: v.color_hex || undefined,
              price_adjustment: v.price_adjustment ?? 0,
              stock: v.stock,
            }))
          : undefined,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View className="gap-1.5">
          <Text variant="medium" className="text-sm text-brand">Product name *</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="e.g. Classic White T-Shirt"
                value={value}
                onChangeText={onChange}
                spellCheck={false}
                autoCorrect={false}
              />
            )}
          />
          {errors.name ? (
            <Text className="text-xs" style={{ color: "#FF4D4F" }}>
              {errors.name.message}
            </Text>
          ) : null}
        </View>

        {/* Description */}
        <View className="gap-1.5">
          <Text variant="medium" className="text-sm text-brand">Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Describe your product..."
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

        {/* Category */}
        <View className="gap-1.5">
          <Text variant="medium" className="text-sm text-brand">Category *</Text>
          <Pressable
            onPress={() => setCatPickerOpen(true)}
            className="flex-row items-center rounded-xl border border-brand-100 bg-white px-4 py-3.5"
          >
            <Text
              className="flex-1 text-sm"
              style={{ color: selectedCategoryId ? "#0A0A0A" : "#9CA3AF" }}
            >
              {selectedCategory?.name ?? "Select a category"}
            </Text>
            <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#9CA3AF" />
          </Pressable>
          {errors.category_id ? (
            <Text className="text-xs" style={{ color: "#FF4D4F" }}>
              {errors.category_id.message}
            </Text>
          ) : null}
        </View>

        {/* Pricing */}
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Text variant="medium" className="text-sm text-brand">Price (JOD) *</Text>
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="0.00"
                  value={value !== undefined ? String(value) : ""}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                />
              )}
            />
            {errors.price ? (
              <Text className="text-xs" style={{ color: "#FF4D4F" }}>
                {errors.price.message}
              </Text>
            ) : null}
          </View>
          <View className="flex-1 gap-1.5">
            <Text variant="medium" className="text-sm text-brand">Original price</Text>
            <Controller
              control={control}
              name="original_price"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="0.00"
                  value={value !== undefined ? String(value) : ""}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
        </View>

        {/* Stock & weight */}
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Text variant="medium" className="text-sm text-brand">Stock *</Text>
            <Controller
              control={control}
              name="stock"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="0"
                  value={value !== undefined ? String(value) : ""}
                  onChangeText={onChange}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.stock ? (
              <Text className="text-xs" style={{ color: "#FF4D4F" }}>
                {errors.stock.message}
              </Text>
            ) : null}
          </View>
          <View className="flex-1 gap-1.5">
            <Text variant="medium" className="text-sm text-brand">Weight (g)</Text>
            <Controller
              control={control}
              name="weight_grams"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="e.g. 250"
                  value={value !== undefined ? String(value) : ""}
                  onChangeText={onChange}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
        </View>

        {/* Images */}
        <View className="gap-2">
          <View className="flex-row items-center">
            <Text variant="medium" className="flex-1 text-sm text-brand">
              Photos ({uploadingImages.length}/7)
            </Text>
            {uploadingImages.length < 7 ? (
              <Pressable
                onPress={pickAndUpload}
                className="flex-row items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "#F5F5F5" }}
              >
                <HugeiconsIcon icon={Image01Icon} size={14} color="#0A0A0A" />
                <Text variant="medium" className="text-xs text-brand">Add Photos</Text>
              </Pressable>
            ) : null}
          </View>

          {uploadingImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pb-2 pt-2">
                {uploadingImages.map((img, i) => (
                  <View key={img.localUri + i} className="relative">
                    <View
                      className="h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-brand-50"
                      style={{ opacity: img.error ? 0.4 : 1 }}
                    >
                      <Image
                        source={{ uri: img.localUri }}
                        style={{ flex: 1, width: "100%" }}
                        contentFit="cover"
                      />
                      {img.uploading ? (
                        <View
                          className="absolute inset-0 items-center justify-center"
                          style={{ backgroundColor: "#00000050" }}
                        >
                          <ActivityIndicator color="#fff" />
                        </View>
                      ) : null}
                    </View>

                    {i === 0 && !img.uploading ? (
                      <View
                        className="absolute bottom-1 left-1 rounded px-1.5 py-0.5"
                        style={{ backgroundColor: "#00000070" }}
                      >
                        <Text style={{ color: "#fff", fontSize: 9 }}>Primary</Text>
                      </View>
                    ) : null}

                    {!img.uploading ? (
                      <Pressable
                        onPress={() => removeImage(i)}
                        className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: "#0A0A0A" }}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} color="#fff" />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <Pressable
              onPress={pickAndUpload}
              className="items-center justify-center gap-2 rounded-xl border border-dashed py-8"
              style={{ borderColor: "#D1D5DB" }}
            >
              <HugeiconsIcon icon={Image01Icon} size={32} color="#9CA3AF" />
              <Text className="text-sm" style={{ color: "#6B7280" }}>
                Tap to add photos
              </Text>
              <Text className="text-xs" style={{ color: "#9CA3AF" }}>
                Up to 7 photos · JPEG, PNG, WebP
              </Text>
            </Pressable>
          )}
        </View>

        {/* Variants */}
        <View className="gap-2">
          <View className="flex-row items-center">
            <Text variant="medium" className="flex-1 text-sm text-brand">Variants</Text>
            <Pressable
              onPress={() =>
                appendVariant({ size: "", color: "", color_hex: "", price_adjustment: 0, stock: 0 })
              }
              className="flex-row items-center gap-1 rounded-lg px-3 py-1.5"
              style={{ backgroundColor: "#F5F5F5" }}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} color="#0A0A0A" />
              <Text variant="medium" className="text-xs text-brand">Add variant</Text>
            </Pressable>
          </View>

          {variantFields.map((field, i) => (
            <View key={field.id} className="gap-2 rounded-xl border border-brand-100 bg-white p-3">
              <View className="flex-row items-center">
                <Text variant="semibold" className="flex-1 text-xs text-brand">
                  Variant {i + 1}
                </Text>
                <Pressable onPress={() => removeVariant(i)}>
                  <HugeiconsIcon icon={Delete02Icon} size={16} color="#FF4D4F" />
                </Pressable>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 gap-1">
                  <Text className="text-xs" style={{ color: "#6B7280" }}>Size</Text>
                  <Controller
                    control={control}
                    name={`variants.${i}.size`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        placeholder="S / M / L"
                        value={value}
                        onChangeText={onChange}
                        spellCheck={false}
                        autoCorrect={false}
                      />
                    )}
                  />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xs" style={{ color: "#6B7280" }}>Color</Text>
                  <Controller
                    control={control}
                    name={`variants.${i}.color`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        placeholder="Red"
                        value={value}
                        onChangeText={onChange}
                        spellCheck={false}
                        autoCorrect={false}
                      />
                    )}
                  />
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 gap-1">
                  <Text className="text-xs" style={{ color: "#6B7280" }}>Price adj. (JOD)</Text>
                  <Controller
                    control={control}
                    name={`variants.${i}.price_adjustment`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        placeholder="0.00"
                        value={value !== undefined ? String(value) : ""}
                        onChangeText={onChange}
                        keyboardType="decimal-pad"
                      />
                    )}
                  />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xs" style={{ color: "#6B7280" }}>Stock *</Text>
                  <Controller
                    control={control}
                    name={`variants.${i}.stock`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        placeholder="0"
                        value={value !== undefined ? String(value) : ""}
                        onChangeText={onChange}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {errors.variants?.[i]?.stock ? (
                    <Text className="text-xs" style={{ color: "#FF4D4F" }}>
                      Required
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit(submit)}
          disabled={submitting}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <HugeiconsIcon icon={Tick01Icon} size={18} color="#fff" />
          )}
          <Text variant="bold" style={{ color: "#fff" }}>
            {submitLabel}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Category picker modal */}
      <Modal visible={catPickerOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-bg-light">
          <View className="flex-row items-center justify-between px-6 py-5">
            <Text variant="bold" className="text-lg text-brand">Select Category</Text>
            <Pressable onPress={() => setCatPickerOpen(false)}>
              <Text variant="medium" className="text-sm" style={{ color: "#FF4D4F" }}>
                Close
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {flatCategories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    setValue("category_id", cat.id);
                    setCatPickerOpen(false);
                  }}
                  className="flex-row items-center py-4"
                  style={{
                    paddingLeft: cat.indent ? 40 : 24,
                    paddingRight: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <Text
                    variant={isSelected ? "bold" : cat.indent ? "regular" : "semibold"}
                    className="flex-1 text-sm"
                    style={{
                      color: isSelected ? "#0A0A0A" : cat.indent ? "#374151" : "#111827",
                    }}
                  >
                    {cat.name}
                  </Text>
                  {isSelected ? (
                    <HugeiconsIcon icon={Tick01Icon} size={18} color="#0A0A0A" />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
