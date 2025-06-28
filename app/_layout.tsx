import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { checkOnboardingStatus } from '@/lib/deviceProfile';
import { router } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Check if onboarding is completed
        const completed = await checkOnboardingStatus();
        setOnboardingCompleted(completed);
        
        // Simple initialization without navigation calls
        console.log('App initializing...');
        
        // Just set ready state - let Stack handle navigation naturally
        setIsReady(true);
      } catch (error) {
        console.error('Error during app initialization:', error);
        setOnboardingCompleted(false);
        setIsReady(true);
      }
    }

    if (fontsLoaded || fontError) {
      prepare().then(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [fontsLoaded, fontError]);

  // Navigate based on onboarding status
  useEffect(() => {
    if (isReady && onboardingCompleted !== null) {
      if (!onboardingCompleted) {
        router.replace('/onboarding');
      }
    }
  }, [isReady, onboardingCompleted]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isReady || onboardingCompleted === null) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}