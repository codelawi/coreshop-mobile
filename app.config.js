export default {
  expo: {
    name: "CoreShop",
    slug: "coreshop-mobile",
    scheme: "coreshop",
    version: "1.11.5",
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
