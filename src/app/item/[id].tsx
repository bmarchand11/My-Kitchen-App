import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Sticker } from '../../components/Sticker';
import { BackButton, FreshnessChip, Screen, Title } from '../../components/ui';
import {
  expiryLabel,
  formatDate,
  formatQuantity,
  freshness,
  locationById,
  quantityStep,
  sectionById,
} from '../../data/kitchen';
import { useKitchen } from '../../data/KitchenContext';
import { colors, fonts } from '../../theme';

function Row({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.value}>{children}</View>
    </View>
  );
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, setQuantity, removeItem } = useKitchen();
  const item = getItem(id);

  if (!item) {
    return (
      <Screen showBottomBar={false}>
        <BackButton label="Kitchen" href="/" />
        <Title>This item is gone</Title>
      </Screen>
    );
  }

  const section = sectionById(item.sectionId);
  const place = section && locationById(section.locationId);
  const fresh = freshness(item);
  const step = quantityStep(item.unit);

  const finish = () => {
    removeItem(item.id);
    router.back();
  };

  return (
    <Screen showBottomBar={false}>
      <BackButton label={section?.name ?? 'Back'} />

      <View style={styles.hero}>
        <Sticker name={item.sticker} size={150} background={fresh === 'fresh' ? colors.surface : '#FFF8E1'} />
        <Title style={{ marginTop: 6 }}>{item.name}</Title>
        <Text style={styles.where}>
          {place?.name} · {section?.name}
        </Text>
      </View>

      <View style={[styles.card, styles.amount]}>
        <View>
          <Text style={[styles.label, { fontSize: 13 }]}>How much is left</Text>
          <Text style={styles.amountText}>
            {item.quantity === 0 ? 'All gone' : `${formatQuantity(item.quantity)} ${item.unit}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Less"
            onPress={() => setQuantity(item.id, item.quantity - step)}
            style={styles.step}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12h14" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
            </Svg>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More"
            onPress={() => setQuantity(item.id, item.quantity + step)}
            style={[styles.step, { backgroundColor: colors.sunflower }]}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, { paddingVertical: 2 }]}>
        <Row label="Expires">
          {item.expiresOn ? (
            <>
              <Text style={styles.valueText}>{formatDate(item.expiresOn)}</Text>
              {fresh === 'fresh' ? (
                <Text style={styles.quiet}>{expiryLabel(item)}</Text>
              ) : (
                <FreshnessChip freshness={fresh} label={expiryLabel(item)} />
              )}
            </>
          ) : (
            <Text style={styles.valueText}>No date</Text>
          )}
        </Row>
        <Row label="Added">
          <Text style={styles.valueText}>{formatDate(item.addedOn)}</Text>
        </Row>
        <Row label="Added by" last>
          <Text style={styles.valueText}>{item.addedBy}</Text>
        </Row>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={finish} style={[styles.action, { backgroundColor: colors.ink }]}>
          <Text style={[styles.actionText, { color: colors.surface }]}>Used it up</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={finish} style={[styles.action, { backgroundColor: colors.surface }]}>
          <Text style={styles.actionText}>Threw it out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 2 },
  where: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  amount: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountText: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink },
  step: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft },
  value: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.ink },
  quiet: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  actions: { flexDirection: 'row', gap: 10, marginTop: 'auto', marginBottom: 8 },
  action: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
});
