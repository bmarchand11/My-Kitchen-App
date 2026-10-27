import { Stack } from 'expo-router';

import { colors } from '../../theme';

// Adding food is its own stack inside the modal, so typing and scanning slide in from the menu.
export default function AddLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
