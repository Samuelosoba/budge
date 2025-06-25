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
      bundleIdentifier: "com.yourcompany.budgeapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.yourcompany.budgeapp"
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
      "expo-dev-client",
      [
        "react-native-purchases",
        {
          "revenuecat_api_key": process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    packagerOpts: {
      "config": "metro.config.js"
    },
    extra: {
      EXPO_PUBLIC_API_URL: "https://c8ac-102-89-40-195.ngrok-free.app",
      EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
    }
  }
}