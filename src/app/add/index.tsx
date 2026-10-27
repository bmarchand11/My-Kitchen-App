import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Sticker, type StickerName } from '../../components/Sticker';
import { CloseButton, Screen, Title } from '../../components/ui';
import { colors, fonts } from '../../theme';

type Option = { title: string; detail: string; tint: string; sticker: StickerName; href: Href | null };

const options: Option[] = [
  { title: 'Scan a barcode', detail: 'One product, added in a second', tint: '#9FD3F5', sticker: 'can', href: '/add/scan' },
  { title: 'Search or type it in', detail: 'Find a product, or type any food', tint: '#FFB3C7', sticker: 'carrot', href: '/add/item' },
  { title: 'Scan a receipt', detail: 'Adds a whole grocery trip at once', tint: colors.sunflower, sticker: 'milk', href: null },
];

export default function AddScreen() {
  return (
    <Screen showBottomBar={false}>
      <View style={styles.header}>
        <Title>Add food</Title>
        <CloseButton />
      </View>

      {options.map((o) => {
        const ready = o.href !== null;
        return (
          <Pressable
            key={o.title}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={() => o.href && router.push(o.href)}
            style={({ pressed }) => [styles.option, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.icon, { backgroundColor: o.tint }]}>
              <Sticker name={o.sticker} size={40} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{o.title}</Text>
              <Text style={styles.optionDetail}>{o.detail}</Text>
            </View>
            {ready ? (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M9 6l6 6-6 6" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            ) : (
              <View style={styles.soon}>
                <Text style={styles.soonText}>Coming soon</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  icon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  optionDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  soon: { borderWidth: 2, borderColor: colors.inkQuiet, borderStyle: 'dashed', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  soonText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.inkSoft },
});
