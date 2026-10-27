import { StyleSheet, Text, View } from 'react-native';

import { Screen, Title } from '../components/ui';
import { colors, fonts } from '../theme';

// Placeholder until accounts and household sharing are built.
export default function HouseholdScreen() {
  return (
    <Screen tab="household">
      <Title>Household</Title>
      <View style={styles.card}>
        <Text style={styles.heading}>Share your kitchen</Text>
        <Text style={styles.body}>
          Soon you'll be able to invite family or roommates so everyone sees and updates the same fridge, freezer, and
          pantry.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
});
