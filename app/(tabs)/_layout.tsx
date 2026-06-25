import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Home03Icon,
  Menu01Icon,
  Search01Icon,
  ShoppingCart01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useThemeColors } from "@/lib/theme";
import { useCartStore } from "@/stores/cart-store";
import { useUnreadCount } from "@/lib/queries/notifications";
import { useLanguageStore } from "@/stores/language-store";

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const language = useLanguageStore((s) => s.language);
  const cartCount = useCartStore((s) => s.count());
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBorder,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarLabelStyle: {
          fontFamily: language === "ar" ? "IBMPlexSansArabic_500Medium" : "Manrope_500Medium",
          fontSize: 11,
        },
        tabBarBadgeStyle: {
          minWidth: 16,
          height: 16,
          fontSize: 9,
          lineHeight: 16,
          fontFamily: language === "ar" ? "IBMPlexSansArabic_700Bold" : "Manrope_700Bold",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={Home03Icon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("tabs.categories"),
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={Menu01Icon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("tabs.search"),
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={Search01Icon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("tabs.cart"),
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={ShoppingCart01Icon} size={24} color={color} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={UserIcon} size={24} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tabs>
  );
}
