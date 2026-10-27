import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Sticker } from '../components/Sticker';
import { FreshnessChip, Screen, Title } from '../components/ui';
import {
  expiryLabel,
  formatQuantity,
  freshness,
  locationById,
  locations,
  sectionById,
  type LocationId,
} from '../data/kitchen';
import { useKitchen } from '../data/KitchenContext';
import { colors, fonts } from '../theme';

type Filter = 'all' | LocationId;

const ORDER = { expired: 0, useSoon: 1, fresh: 2 };

export default function ListScreen() {
  const params = useLocalSearchParams<{ location?: string }>();
  const { items } = useKitchen();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(
    locationById(params.location ?? '') ? (params.location as LocationId) : 'all',
  );

  const q = query.trim().toLowerCase();
  const rows = items
    .map((item) => {
      const section = sectionById(item.sectionId);
      return { item, section, place: section && locationById(section.locationId) };
    })
    .filter(({ item, place }) => (filter === 'all' || place?.id === filter) && item.name.toLowerCase().includes(q))
    .sort(
      (a, b) =>
        ORDER[freshness(a.item)] - ORDER[freshness(b.item)] || a.item.name.localeCompare(b.item.name),
    );

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...locations.map((l) => ({ id: l.id, label: l.name })),
  ];

  return (
    <Screen tab="list">
      <View style={styles.titleRow}>
        <Title>Everything</Title>
        <Text style={styles.count}>{rows.length} shown</Text>
      </View>

      <View style={styles.search}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.inkSoft} strokeWidth={2.4} strokeLinecap="round">
          <Circle cx={11} cy={11} r={7} />
          <Path d="M20 20l-4-4" />
        </Svg>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your food"
          placeholderTextColor={colors.inkQuiet}
          accessibilityLabel="Search your food"
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filters} accessibilityRole="tablist">
        {filters.map((f) => {
          const on = f.id === filter;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(f.id)}
              style={[styles.chip, on && { backgroundColor: colors.ink }]}
            >
              <Text style={[styles.chipText, on && { color: colors.surface }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        style={styles.listBox}
        data={rows}
        keyExtractor={(r) => r.item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>No food matches that search.</Text>}
        renderItem={({ item: { item, section, place } }) => {
          const fresh = freshness(item);
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/item/${item.id}`)} style={styles.row}>
              <Sticker name={item.sticker} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <FreshnessChip freshness={fresh} label={expiryLabel(item)} />
                </View>
                <Text style={styles.where}>
                  {place?.name} · {section?.name}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.qty}>{formatQuantity(item.quantity)}</Text>
                <Text style={styles.where}>{item.unit}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  count: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, paddingVertical: 10 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  listBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
  where: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  qty: { fontFamily: fonts.display, fontSize: 22, lineHeight: 24, color: colors.ink },
  empty: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft, padding: 16 },
});
