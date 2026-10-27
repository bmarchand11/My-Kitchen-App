import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Screen, Title } from '../components/ui';
import { colors, fonts } from '../theme';

const options = [
  { title: 'Scan a receipt', detail: 'Adds a whole grocery trip at once', tint: colors.sunflower },
  { title: 'Scan a barcode', detail: 'One product, added in a second', tint: '#9FD3F5' },
  { title: 'Type it in', detail: 'We fill in the rest for you', tint: '#FFB3C7' },
];

// The three ways to add food arrive in the next build steps; this screen shows where they will live.
export default function AddScreen() {
  return (
    <Screen showBottomBar={false}>
      <View style={styles.header}>
        <Title>Add food</Title>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke={colors.ink} strokeWidth={2.6} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      {options.map((o) => (
        <View key={o.title} style={styles.option}>
          <View style={[styles.icon, { backgroundColor: o.tint }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>{o.title}</Text>
            <Text style={styles.optionDetail}>{o.detail}</Text>
          </View>
          <View style={styles.soon}>
            <Text style={styles.soonText}>Coming soon</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    padding: 16,
  },
  icon: { width: 56, height: 56, borderRadius: 16, borderWidth: 2, borderColor: colors.ink },
  optionTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  optionDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  soon: { borderWidth: 2, borderColor: colors.inkQuiet, borderStyle: 'dashed', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  soonText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.inkSoft },
});
