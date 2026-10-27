import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Sticker, type StickerName } from '../components/Sticker';
import { Screen, Title } from '../components/ui';
import { freshness, type Item, type LocationId } from '../data/kitchen';
import { useKitchen } from '../data/KitchenContext';
import { colors, fonts } from '../theme';

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function previewStickers(items: Item[], count: number): StickerName[] {
  return [...new Set(items.map((i) => i.sticker))].slice(0, count);
}

function itemCount(n: number): string {
  return n === 1 ? '1 item' : `${n} items`;
}

export default function KitchenHome() {
  const { items, itemsInLocation } = useKitchen();
  const useSoon = items.filter((i) => freshness(i) !== 'fresh');
  const fridge = itemsInLocation('fridge');
  const freezer = itemsInLocation('freezer');
  const pantry = itemsInLocation('pantry');
  const fridgeSoon = fridge.filter((i) => freshness(i) !== 'fresh').length;

  const open = (id: LocationId) => router.push(`/location/${id}`);

  return (
    <Screen tab="kitchen">
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Title>Our Kitchen</Title>
        </View>
        <View style={styles.avatars}>
          <View style={[styles.avatar, { backgroundColor: colors.sunflower }]}>
            <Text style={styles.avatarText}>B</Text>
          </View>
        </View>
      </View>

      {useSoon.length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/list')} style={styles.soonCard}>
          <Sticker name={useSoon[0].sticker} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.soonTitle}>
              {useSoon.length === 1 ? '1 item to use soon' : `${useSoon.length} items to use soon`}
            </Text>
            <Text style={styles.soonNames} numberOfLines={1}>
              {useSoon.map((i) => i.name).join(', ')}
            </Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      )}

      <View style={styles.wall}>
        <Text style={styles.hint}>Tap a door to open it</Text>
        <View style={styles.appliances}>
          <View style={styles.fridgeUnit}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open the freezer, ${itemCount(freezer.length)}`}
              onPress={() => open('freezer')}
              style={[styles.door, styles.freezerDoor]}
            >
              <View style={[styles.handle, { height: 48 }]} />
              <View>
                <Text style={styles.doorName}>Freezer</Text>
                <Text style={styles.doorCount}>{itemCount(freezer.length)}</Text>
              </View>
              <View style={styles.stickerRow}>
                {previewStickers(freezer, 2).map((s) => (
                  <Sticker key={s} name={s} size={36} />
                ))}
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open the fridge, ${itemCount(fridge.length)}`}
              onPress={() => open('fridge')}
              style={[styles.door, { flex: 1 }]}
            >
              <View style={[styles.handle, { height: 88 }]} />
              <View>
                <Text style={[styles.doorName, { fontSize: 26, lineHeight: 30 }]}>Fridge</Text>
                <Text style={styles.doorCount}>{itemCount(fridge.length)}</Text>
                {fridgeSoon > 0 && (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonBadgeText}>{fridgeSoon} use soon</Text>
                  </View>
                )}
              </View>
              <View style={styles.stickerRow}>
                {previewStickers(fridge, 3).map((s) => (
                  <Sticker key={s} name={s} size={36} />
                ))}
              </View>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open the pantry, ${itemCount(pantry.length)}`}
            onPress={() => open('pantry')}
            style={styles.pantry}
          >
            <View style={styles.knob} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.doorName}>Pantry</Text>
              <Text style={[styles.doorCount, { color: colors.pantryText }]}>{itemCount(pantry.length)}</Text>
            </View>
            <View style={{ gap: 4, alignItems: 'center' }}>
              {previewStickers(pantry, 2).map((s) => (
                <Sticker key={s} name={s} size={36} />
              ))}
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkQuiet },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  soonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.useSoon,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  soonTitle: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.ink },
  soonNames: { fontFamily: fonts.body, fontSize: 13, color: colors.useSoonText },
  wall: {
    flex: 1,
    backgroundColor: colors.kitchenWall,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 16,
    gap: 10,
    marginHorizontal: -4,
  },
  hint: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  appliances: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  fridgeUnit: {
    flex: 1.55,
    height: '96%',
    borderWidth: 3,
    borderColor: colors.ink,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: colors.fridge,
    overflow: 'hidden',
  },
  door: { paddingVertical: 14, paddingLeft: 26, paddingRight: 12, justifyContent: 'space-between' },
  freezerDoor: { height: '33%', backgroundColor: colors.freezer, borderBottomWidth: 3, borderBottomColor: colors.ink },
  handle: { position: 'absolute', left: 10, top: 24, width: 6, borderRadius: 3, backgroundColor: colors.ink },
  doorName: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink },
  doorCount: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  stickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  soonBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.useSoon,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  soonBadgeText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.useSoonText },
  pantry: {
    flex: 1,
    height: '84%',
    borderWidth: 3,
    borderColor: colors.ink,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: colors.pantry,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  knob: { position: 'absolute', right: 8, top: '45%', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
});
