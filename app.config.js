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
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "https://c8ac-102-89-40-195.ngrok-free.app",
      EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
         eas: {
      projectId: "07fe8602-893a-4994-a6fe-4cc04acafbce"
    }
    },
 
  }
}