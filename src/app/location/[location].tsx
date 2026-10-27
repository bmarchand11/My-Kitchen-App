import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Sticker } from '../../components/Sticker';
import { BackButton, Pill, Screen, Title } from '../../components/ui';
import { freshness, locationById, sections, type LocationId, type Section } from '../../data/kitchen';
import { useKitchen } from '../../data/KitchenContext';
import { colors, fonts } from '../../theme';

const looks: Record<LocationId, { inside: string; divider: string; tile: string; hint: string }> = {
  fridge: { inside: colors.fridgeInside, divider: colors.glassShelf, tile: colors.surface, hint: 'tap a shelf' },
  freezer: { inside: colors.freezerInside, divider: colors.freezerInside, tile: colors.surface, hint: 'tap a bin' },
  pantry: { inside: colors.pantryInside, divider: colors.pantryShelf, tile: colors.pantryInside, hint: 'tap a shelf' },
};

function SectionTile({ section, look }: { section: Section; look: (typeof looks)[LocationId] }) {
  const { itemsInSection } = useKitchen();
  const items = itemsInSection(section.id);
  const soon = items.filter((i) => freshness(i) !== 'fresh').length;
  const stickers = [...new Set(items.map((i) => i.sticker))].slice(0, 4);
  const isDrawer = section.style === 'drawer';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${section.name}, ${items.length} items${soon ? `, ${soon} to use soon` : ''}`}
      onPress={() => router.push(`/section/${section.id}`)}
      style={({ pressed }) => [
        isDrawer ? styles.drawer : [styles.shelf, { borderBottomColor: look.divider, backgroundColor: look.tile }],
        isDrawer && section.locationId === 'fridge' && { backgroundColor: colors.drawer },
        pressed && { opacity: 0.75 },
      ]}
    >
      {isDrawer && <View style={styles.drawerHandle} />}
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{section.name}</Text>
          {soon > 0 && (
            <View style={styles.soon}>
              <Text style={styles.soonText}>{soon} use soon</Text>
            </View>
          )}
        </View>
        <View style={styles.stickers}>
          {stickers.length > 0 ? (
            stickers.map((s) => <Sticker key={s} name={s} size={38} />)
          ) : (
            <Text style={styles.empty}>Empty</Text>
          )}
        </View>
      </View>
      <Text style={styles.count}>{items.length === 1 ? '1 item' : `${items.length} items`}</Text>
    </Pressable>
  );
}

export default function LocationScreen() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const { itemsInLocation } = useKitchen();
  const place = locationById(location);

  if (!place) {
    return (
      <Screen tab="kitchen">
        <BackButton label="Kitchen" href="/" />
        <Title>Not found</Title>
      </Screen>
    );
  }

  const look = looks[place.id];
  const here = sections.filter((s) => s.locationId === place.id);
  const inside = here.filter((s) => s.style !== 'door');
  const door = here.filter((s) => s.style === 'door');
  const total = itemsInLocation(place.id).length;

  return (
    <Screen tab="kitchen">
      <View style={styles.topRow}>
        <BackButton label="Kitchen" href="/" />
        <Pill label="List view" onPress={() => router.navigate({ pathname: '/list', params: { location: place.id } })} />
      </View>
      <View style={styles.titleRow}>
        <Title>{place.name}</Title>
        <Text style={styles.subtitle}>
          {total} items · {look.hint}
        </Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          style={[styles.inside, { backgroundColor: look.inside }, place.id === 'pantry' && styles.pantryInside]}
          contentContainerStyle={place.id === 'freezer' ? styles.freezerContent : undefined}
        >
          {inside.map((s) => (
            <SectionTile key={s.id} section={s} look={look} />
          ))}
        </ScrollView>

        {door.length > 0 && (
          <View style={styles.door}>
            <Text style={styles.doorLabel}>DOOR</Text>
            {door.map((s) => (
              <DoorRack key={s.id} section={s} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function DoorRack({ section }: { section: Section }) {
  const { itemsInSection } = useKitchen();
  const items = itemsInSection(section.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${section.name} in the door, ${items.length} items`}
      onPress={() => router.push(`/section/${section.id}`)}
      style={styles.rack}
    >
      <Text style={[styles.name, { fontSize: 14, lineHeight: 18, textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit>
        {section.name}
      </Text>
      <Sticker name={section.sticker} size={38} />
      <Text style={styles.count}>{items.length === 1 ? '1 item' : `${items.length} items`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  subtitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
  body: { flex: 1, flexDirection: 'row', gap: 8, paddingBottom: 14 },
  inside: { flex: 1, borderWidth: 3, borderColor: colors.ink, borderRadius: 20 },
  pantryInside: { borderRadius: 16 },
  freezerContent: { paddingVertical: 12, gap: 10 },
  shelf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    minHeight: 92,
  },
  drawer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 10,
    marginVertical: 4,
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 14,
    backgroundColor: colors.surface,
    minHeight: 92,
  },
  drawerHandle: {
    position: 'absolute',
    top: 6,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.ink },
  soon: {
    backgroundColor: colors.useSoon,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  soonText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.useSoonText },
  stickers: { flexDirection: 'row', gap: 4 },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkQuiet },
  count: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  door: {
    width: 88,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 20,
    backgroundColor: colors.fridge,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 8,
  },
  doorLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 0.6, color: colors.inkSoft },
  rack: { alignItems: 'center', gap: 6 },
});
