import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { daysUntil } from '../data/kitchen';
import { useReminders } from '../data/RemindersContext';
import { describeReminder, recommendedReminder } from '../data/reminders';
import { colors, fonts } from '../theme';
import { Sticker, type StickerName } from './Sticker';
import { Button, ErrorNote } from './ui';

export type AddedFood = { itemId: string; name: string; sticker: StickerName; expiresOn: string | null };

type Offer = AddedFood & { at: Date };

// Picks out the food that goes off soon enough to deserve its own reminder.
export function reminderOffers(added: AddedFood[], hour: number): Offer[] {
  return added
    .map((a) => ({ ...a, at: recommendedReminder(a.expiresOn, hour) }))
    .filter((o): o is Offer => o.at !== null);
}

// Shown right after adding quick-spoiling food: "Remind you about the chicken?"
export function ReminderOffer({ offers, onDone }: { offers: Offer[]; onDone: () => void }) {
  const { remindAbout } = useReminders();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (offers.length === 0) return null;

  const one = offers.length === 1 ? offers[0] : null;
  const accept = async () => {
    setBusy(true);
    setError(null);
    const ok = await remindAbout(offers.map((o) => ({ itemId: o.itemId, name: o.name, at: o.at.toISOString() })));
    setBusy(false);
    if (ok) onDone();
    else setError('Notifications are off for My Kitchen. You can turn them on in Settings.');
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          {one ? (
            <>
              <View style={styles.titleRow}>
                <Sticker name={one.sticker} size={52} />
                <Text style={styles.title}>Remind you about the {one.name.toLowerCase()}?</Text>
              </View>
              <Text style={styles.body}>
                It goes off in {daysUntil(one.expiresOn!)} {daysUntil(one.expiresOn!) === 1 ? 'day' : 'days'}. We’ll remind you{' '}
                {describeReminder(one.at)}, before it goes bad.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                {offers.length} of these go bad within a week. Want reminders?
              </Text>
              {offers.slice(0, 6).map((o) => (
                <View key={o.itemId} style={styles.itemRow}>
                  <Sticker name={o.sticker} size={32} />
                  <Text style={styles.itemName} numberOfLines={1}>
                    {o.name}
                  </Text>
                  <Text style={styles.itemWhen}>{describeReminder(o.at, new Date(), true)}</Text>
                </View>
              ))}
              {offers.length > 6 && <Text style={styles.body}>and {offers.length - 6} more</Text>}
            </>
          )}
          <ErrorNote message={error} />
          <Button label={one ? 'Remind me' : 'Remind me about these'} onPress={accept} busy={busy} />
          <Pressable accessibilityRole="button" onPress={onDone} style={styles.skip}>
            <Text style={styles.skipText}>No thanks</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(31,42,68,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.ink,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 22, lineHeight: 27, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.ink },
  itemWhen: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  skip: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  skipText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.inkSoft, textDecorationLine: 'underline' },
});
