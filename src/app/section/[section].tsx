import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Sticker } from '../../components/Sticker';
import { BackButton, FreshnessChip, Screen, Title } from '../../components/ui';
import { expiryLabel, formatQuantity, freshness, locationById, sectionById, type Item } from '../../data/kitchen';
import { useKitchen } from '../../data/KitchenContext';
import { colors, fonts } from '../../theme';

type Mode = 'pictures' | 'list';

function ItemCard({ item }: { item: Item }) {
  const fresh = freshness(item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatQuantity(item.quantity)} ${item.unit}, ${expiryLabel(item)}`}
      onPress={() => router.push(`/item/${item.id}`)}
      style={[styles.card, fresh !== 'fresh' && { backgroundColor: '#FFF8E1' }]}
    >
      <View style={styles.qty}>
        <Text style={styles.qtyText}>
          {formatQuantity(item.quantity)} {item.unit}
        </Text>
      </View>
      <Sticker name={item.sticker} size={76} background={colors.background} />
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
      {fresh === 'fresh' ? (
        <Text style={styles.expiry}>{expiryLabel(item)}</Text>
      ) : (
        <FreshnessChip freshness={fresh} label={expiryLabel(item)} />
      )}
    </Pressable>
  );
}

function ItemRow({ item }: { item: Item }) {
  const fresh = freshness(item);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/item/${item.id}`)} style={styles.row}>
      <Sticker name={item.sticker} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowName}>{item.name}</Text>
        {fresh === 'fresh' ? (
          <Text style={styles.expiry}>{expiryLabel(item)}</Text>
        ) : (
          <FreshnessChip freshness={fresh} label={expiryLabel(item)} />
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.rowQty}>{formatQuantity(item.quantity)}</Text>
        <Text style={styles.expiry}>{item.unit}</Text>
      </View>
    </Pressable>
  );
}

export default function SectionScreen() {
  const { section: sectionId } = useLocalSearchParams<{ section: string }>();
  const { itemsInSection } = useKitchen();
  const [mode, setMode] = useState<Mode>('pictures');
  const section = sectionById(sectionId);
  const place = section && locationById(section.locationId);

  if (!section || !place) {
    return (
      <Screen tab="kitchen">
        <BackButton label="Kitchen" href="/" />
        <Title>Not found</Title>
      </Screen>
    );
  }

  // Items that need using up come first, then alphabetical.
  const items = [...itemsInSection(section.id)].sort((a, b) => {
    const order = { expired: 0, useSoon: 1, fresh: 2 };
    return order[freshness(a)] - order[freshness(b)] || a.name.localeCompare(b.name);
  });

  return (
    <Screen tab="kitchen">
      <BackButton label={place.name} />
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.where}>{place.name}</Text>
          <Title>{section.name}</Title>
        </View>
        <View style={styles.toggle} accessibilityRole="tablist">
          {(['pictures', 'list'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              onPress={() => setMode(m)}
              style={[styles.toggleButton, mode === m && { backgroundColor: colors.ink }]}
            >
              <Text style={[styles.toggleText, mode === m && { color: colors.surface }]}>
                {m === 'pictures' ? 'Pictures' : 'List'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.shelf}
        contentContainerStyle={mode === 'pictures' ? styles.grid : styles.list}
      >
        {items.length === 0 && <Text style={styles.empty}>Nothing here yet.</Text>}
        {mode === 'pictures'
          ? items.map((i) => <ItemCard key={i.id} item={i} />)
          : items.map((i) => <ItemRow key={i.id} item={i} />)}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  where: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  toggle: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  toggleButton: { paddingHorizontal: 14, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  toggleText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.ink },
  shelf: {
    flex: 1,
    backgroundColor: colors.fridgeInside,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 22,
    marginBottom: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 14 },
  list: { paddingVertical: 4 },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  qty: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  qtyText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.surface },
  cardName: { fontFamily: fonts.display, fontSize: 17, lineHeight: 20, color: colors.ink, textAlign: 'center', marginTop: 4 },
  expiry: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  rowName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
  rowQty: { fontFamily: fonts.display, fontSize: 22, lineHeight: 24, color: colors.ink },
  empty: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft, padding: 16 },
});
