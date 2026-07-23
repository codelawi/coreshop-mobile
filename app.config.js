const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
const androidOAuthScheme = androidClientId
  ? `com.googleusercontent.apps.${androidClientId.replace(".apps.googleusercontent.com", "")}`
  : "com.googleusercontent.apps.626063460740-pqhbpvld97iqbffte6lh9v4d0j1d6a6u";

export default {
  expo: {
    name: "CoreShop",
    slug: "coreshop-mobile",
    scheme: "coreshop",
    version: "1.10.1",
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
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Allow CoreShop to use your location to show nearby stores.",
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "com.googleusercontent.apps.529051789015-h5gvalnbobq9k9nbsncoi9ar69gd1hkm",
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
      googleServicesFile: "./google-services.json",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.coreshop.mobile",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [{ scheme: androidOAuthScheme }],
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
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? "",
        },
      ],
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
          color: "#FF4D4F",
          sounds: [],
          androidMode: "default",
          androidCollapsedTitle: "CoreShop",
          defaultChannel: "coreshop_v2",
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
