import { Baloo2_800ExtraBold, useFonts as useBaloo } from '@expo-google-fonts/baloo-2';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts as useNunito,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { KitchenProvider } from '../data/KitchenContext';
import { colors } from '../theme';

export default function RootLayout() {
  const [balooLoaded] = useBaloo({ Baloo2_800ExtraBold });
  const [nunitoLoaded] = useNunito({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  if (!balooLoaded || !nunitoLoaded) return null;

  return (
    <SafeAreaProvider>
      <KitchenProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="list" options={{ animation: 'none' }} />
          <Stack.Screen name="household" options={{ animation: 'none' }} />
          <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        </Stack>
      </KitchenProvider>
    </SafeAreaProvider>
  );
}
