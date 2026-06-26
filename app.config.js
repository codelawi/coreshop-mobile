export default {
  expo: {
    name: "CoreShop",
    slug: "coreshop-mobile",
    scheme: "coreshop",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.coreshop.mobile",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Allow CoreShop to use your location to show nearby stores.",
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "com.googleusercontent.apps.626063460740-tpasknjfe5ml4eu3nkevkf3di5ao4htq",
            ],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#0A0A0A",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.coreshop.mobile",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        },
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme:
                "com.googleusercontent.apps.626063460740-pqhbpvld97iqbffte6lh9v4d0j1d6a6u",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow CoreShop to use your location to show nearby stores.",
        },
      ],
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#0A0A0A",
          sounds: [],
          androidMode: "default",
          androidCollapsedTitle: "CoreShop",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "ac7a0146-f6aa-4fa3-b939-a8bc4713c03e",
      },
    },
    owner: "coreshop-io",
  },
};
