import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { guessOrFallback, matchCommonFoods } from '../data/guess';
import { useKitchen } from '../data/KitchenContext';
import { searchProducts } from '../lib/products';
import { colors, fonts } from '../theme';
import { isStickerName, Sticker, type StickerName } from './Sticker';

export type Suggestion = {
  name: string;
  sticker: StickerName;
  sectionId: string;
  unit: string;
  shelfLifeDays: number | null;
  barcode: string | null;
};

type Group = { title: string; items: Suggestion[] };

function fromGuess(name: string, hints: string, barcode: string | null): Suggestion {
  const guess = guessOrFallback(hints);
  return { name, barcode, ...guess };
}

// Suggestions shown under the name field: what this kitchen has scanned before,
// everyday foods, then matching products from Open Food Facts.
export function ProductSearch({ query, onPick }: { query: string; onPick: (s: Suggestion) => void }) {
  const { searchRememberedProducts } = useKitchen();
  // The kitchen's functions change identity whenever its food reloads; only a new query should restart the search.
  const searchKitchen = useRef(searchRememberedProducts);
  searchKitchen.current = searchRememberedProducts;
  const [kitchen, setKitchen] = useState<Suggestion[]>([]);
  const [online, setOnline] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const common = matchCommonFoods(query).map((name) => fromGuess(name, name, null));

  useEffect(() => {
    const q = query.trim();
    setKitchen([]);
    setOnline([]);
    if (q.length < 2) return;
    const controller = new AbortController();
    // Wait for a pause in typing before searching.
    const timer = setTimeout(async () => {
      searchKitchen.current(q)
        .then((rows) => {
          if (controller.signal.aborted) return;
          setKitchen(
            rows.map((r) => ({
              name: r.name,
              sticker: isStickerName(r.sticker) ? r.sticker : 'can',
              sectionId: r.sectionId,
              unit: r.unit,
              shelfLifeDays: guessOrFallback(r.name).shelfLifeDays,
              barcode: r.barcode,
            })),
          );
        })
        .catch(() => {});
      if (q.length < 3) return;
      setSearching(true);
      try {
        const matches = await searchProducts(q, controller.signal);
        if (!controller.signal.aborted) setOnline(matches.map((m) => fromGuess(m.name, m.hints, m.barcode)));
      } catch {
        // Offline or the database is down: the other suggestions still work.
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
      setSearching(false);
    };
  }, [query]);

  const taken = new Set<string>();
  const unique = (items: Suggestion[]) =>
    items.filter((s) => {
      const key = s.name.toLowerCase();
      if (taken.has(key)) return false;
      taken.add(key);
      return true;
    });
  const groups: Group[] = [
    { title: 'Added before', items: unique(kitchen) },
    { title: 'Common foods', items: unique(common) },
    { title: 'Products', items: unique(online).slice(0, 5) },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0 && !searching) return null;

  return (
    <View style={styles.box} accessibilityLabel="Suggestions">
      {groups.map((g) => (
        <View key={g.title}>
          <Text style={styles.groupTitle}>{g.title}</Text>
          {g.items.map((s) => (
            <Pressable
              key={`${g.title}-${s.name}`}
              accessibilityRole="button"
              accessibilityLabel={`Use ${s.name}`}
              onPress={() => onPick(s)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.kitchenWall }]}
            >
              <Sticker name={s.sticker} size={32} />
              <Text style={styles.name} numberOfLines={2}>
                {s.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
      {searching && (
        <View style={styles.searching}>
          <ActivityIndicator color={colors.ink} size="small" />
          <Text style={styles.searchingText}>Searching products…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  groupTitle: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 12,
    color: colors.inkQuiet,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 6, minHeight: 44 },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  searching: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  searchingText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
});
