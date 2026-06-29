import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 280 }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
      <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right', animationDuration: 320 }} />
      <Stack.Screen name="signup" options={{ animation: 'slide_from_right', animationDuration: 320 }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 350 }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlertProvider>
            <LanguageProvider>
              <AuthProvider>
                <AppProvider>
                  <RootLayoutNav />
                </AppProvider>
              </AuthProvider>
            </LanguageProvider>
          </AlertProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
