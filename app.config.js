export default {
  expo: {
    name: "bolt-expo-nativewind",
    slug: "bolt-expo-nativewind",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.batoseet.budgeapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.batoseet.budgeapp",
      versionCode: 1
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router", 
      "expo-font", 
      "expo-web-browser",
      "expo-dev-client"
    ],
    experiments: {
      typedRoutes: true
    },
    packagerOpts: {
      "config": "metro.config.js"
    },
    extra: {
      EXPO_PUBLIC_API_URL: "https://1b1d-129-205-124-201.ngrok-free.app/api",
      EXPO_PUBLIC_REVENUECAT_API_KEY: "goog_OwQUxxbXXDcwGkmUWWwIcWMBaEV",
      eas: {
        projectId: "07fe8602-893a-4994-a6fe-4cc04acafbce"
      }
    }
  }
}