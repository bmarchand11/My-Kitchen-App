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
import { RemindersProvider } from '../data/RemindersContext';
import { SessionProvider, useSession } from '../data/SessionContext';
import { colors } from '../theme';

function Routes() {
  const { ready, session, household } = useSession();
  if (!ready) return null;

  const signedIn = !!session;
  const hasHousehold = signedIn && !!household;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ animation: 'none' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasHousehold}>
        <Stack.Screen name="household-setup" options={{ animation: 'none' }} />
      </Stack.Protected>
      <Stack.Protected guard={hasHousehold}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="list" options={{ animation: 'none' }} />
        <Stack.Screen name="household" options={{ animation: 'none' }} />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="location/[location]" />
        <Stack.Screen name="section/[section]" />
        <Stack.Screen name="item/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [balooLoaded] = useBaloo({ Baloo2_800ExtraBold });
  const [nunitoLoaded] = useNunito({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  if (!balooLoaded || !nunitoLoaded) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <KitchenProvider>
          <RemindersProvider>
            <StatusBar style="dark" />
            <Routes />
          </RemindersProvider>
        </KitchenProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
