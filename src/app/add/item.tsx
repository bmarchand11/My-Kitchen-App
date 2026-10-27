import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { isStickerName, Sticker, stickerNames, type StickerName } from '../../components/Sticker';
import { BackButton, Button, ChoiceChip, CloseButton, ErrorNote, Field, Screen, Title } from '../../components/ui';
import { commonUnits, guessFromName, guessOrFallback } from '../../data/guess';
import {
  daysFromToday,
  daysUntil,
  formatDate,
  formatQuantity,
  locations,
  quantityStep,
  sectionById,
  sections,
  type LocationId,
} from '../../data/kitchen';
import { useKitchen } from '../../data/KitchenContext';
import { colors, fonts } from '../../theme';

const expiryPresets: { label: string; days: number | null }[] = [
  { label: 'No date', days: null },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

type Params = {
  name?: string;
  barcode?: string;
  // Extra words from a barcode lookup (categories) that sharpen the guess.
  hints?: string;
  sticker?: string;
  section?: string;
  unit?: string;
  // Set when a scanned barcode wasn't in the product database.
  unknown?: string;
};

type Draft = {
  name: string;
  sticker: StickerName;
  sectionId: string;
  quantity: number;
  unit: string;
  expiresOn: string | null;
};

function initialDraft(params: Params): Draft {
  const name = params.name ?? '';
  const guess = guessOrFallback(params.hints ?? name);
  return {
    name,
    sticker: params.sticker && isStickerName(params.sticker) ? params.sticker : guess.sticker,
    sectionId: params.section && sectionById(params.section) ? params.section : guess.sectionId,
    quantity: 1,
    unit: params.unit || guess.unit,
    expiresOn: guess.shelfLifeDays === null ? null : daysFromToday(guess.shelfLifeDays),
  };
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

function RoundButton({ label, icon, onPress }: { label: string; icon: 'minus' | 'plus'; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={styles.round}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d={icon === 'plus' ? 'M12 5v14M5 12h14' : 'M5 12h14'} stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

// Type food in. Also where a barcode scan lands, with the name and picture already filled in.
export default function AddItemScreen() {
  const params = useLocalSearchParams<Params>();
  const barcode = params.barcode || null;
  const { addItem } = useKitchen();
  const [draft, setDraft] = useState<Draft>(() => initialDraft(params));
  // Once someone picks a picture, section, unit, or date by hand, typing the name stops changing it.
  const [picked, setPicked] = useState({ sticker: false, section: false, unit: false, expiry: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const nameInput = useRef<TextInputInstance>(null);

  const section = sectionById(draft.sectionId);
  const locationId: LocationId = section?.locationId ?? 'fridge';
  const unitChoices = commonUnits.includes(draft.unit) ? commonUnits : [draft.unit, ...commonUnits];
  const step = quantityStep(draft.unit);

  const update = (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes }));

  const changeName = (name: string) => {
    const guess = guessFromName(name);
    setDraft((d) => {
      if (!guess) return { ...d, name };
      return {
        ...d,
        name,
        sticker: picked.sticker ? d.sticker : guess.sticker,
        sectionId: picked.section ? d.sectionId : guess.sectionId,
        unit: picked.unit ? d.unit : guess.unit,
        expiresOn: picked.expiry
          ? d.expiresOn
          : guess.shelfLifeDays === null
            ? null
            : daysFromToday(guess.shelfLifeDays),
      };
    });
  };

  const pickLocation = (id: LocationId) => {
    if (id === locationId) return;
    const first = sections.find((s) => s.locationId === id);
    if (first) update({ sectionId: first.id });
    // Freezing buys months; moving out of the freezer goes back to the usual guess.
    if (!picked.expiry) {
      const usual = guessFromName(draft.name)?.shelfLifeDays ?? null;
      const days = id === 'freezer' ? 90 : usual;
      update({ expiresOn: days === null ? null : daysFromToday(days) });
    }
    setPicked((p) => ({ ...p, section: true }));
  };

  const save = async () => {
    setError(null);
    setSaved(null);
    if (!draft.name.trim()) {
      setError('What is it? Type a name like “Milk” or “Chicken breasts”.');
      return;
    }
    if (draft.quantity <= 0) {
      setError('How much is there? Use + to set an amount.');
      return;
    }
    setBusy(true);
    try {
      await addItem({ ...draft, barcode });
      if (barcode) {
        // Back to the scanner, ready for the next product.
        router.back();
        return;
      }
      setSaved(`Added ${draft.name.trim()} to ${section?.name ?? 'your kitchen'}. Add another, or close when you’re done.`);
      setDraft(initialDraft({}));
      setPicked({ sticker: false, section: false, unit: false, expiry: false });
      nameInput.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const expiresIn = draft.expiresOn ? daysUntil(draft.expiresOn) : null;

  return (
    <Screen showBottomBar={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <BackButton label="Add food" />
            <CloseButton />
          </View>
          <Title>{barcode ? 'Check it over' : 'Type it in'}</Title>

          {saved && <Text style={styles.saved}>{saved}</Text>}
          {params.unknown && (
            <Text style={styles.unknown}>
              We didn’t recognize that barcode. Type the name once and we’ll remember it next time anyone in your
              kitchen scans it.
            </Text>
          )}

          <View style={styles.nameRow}>
            <Sticker name={draft.sticker} size={64} />
            <View style={{ flex: 1 }}>
              <Field
                ref={nameInput}
                label="What is it?"
                value={draft.name}
                onChangeText={changeName}
                placeholder="Milk, chicken, spinach…"
                autoFocus={!params.name}
                autoCapitalize="sentences"
                returnKeyType="done"
                maxLength={100}
              />
            </View>
          </View>

          <Group label="Picture">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRow}>
              {stickerNames.map((name) => {
                const on = name === draft.sticker;
                return (
                  <Pressable
                    key={name}
                    accessibilityRole="radio"
                    accessibilityLabel={`Picture: ${name}`}
                    accessibilityState={{ selected: on }}
                    onPress={() => {
                      update({ sticker: name });
                      setPicked((p) => ({ ...p, sticker: true }));
                    }}
                    style={[styles.stickerChoice, on && styles.stickerChoiceOn]}
                  >
                    <Sticker name={name} size={44} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Group>

          <Group label="Where does it go?">
            <View style={styles.chips} accessibilityRole="radiogroup">
              {locations.map((l) => (
                <ChoiceChip key={l.id} label={l.name} selected={l.id === locationId} onPress={() => pickLocation(l.id)} />
              ))}
            </View>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {sections
                .filter((s) => s.locationId === locationId)
                .map((s) => (
                  <ChoiceChip
                    key={s.id}
                    label={s.name}
                    selected={s.id === draft.sectionId}
                    onPress={() => {
                      update({ sectionId: s.id });
                      setPicked((p) => ({ ...p, section: true }));
                    }}
                  />
                ))}
            </View>
          </Group>

          <Group label="How much?">
            <View style={styles.stepper}>
              <RoundButton
                label="Less"
                icon="minus"
                onPress={() => update({ quantity: Math.max(step, +(draft.quantity - step).toFixed(2)) })}
              />
              <Text style={styles.amount} accessibilityLiveRegion="polite">
                {formatQuantity(draft.quantity)} {draft.unit}
              </Text>
              <RoundButton label="More" icon="plus" onPress={() => update({ quantity: +(draft.quantity + step).toFixed(2) })} />
            </View>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {unitChoices.map((u) => (
                <ChoiceChip
                  key={u}
                  label={u}
                  selected={u === draft.unit}
                  onPress={() => {
                    // Whole-number units can't hold a quarter, so round up when switching to one.
                    const q = quantityStep(u) === 1 ? Math.max(1, Math.ceil(draft.quantity)) : draft.quantity;
                    update({ unit: u, quantity: q });
                    setPicked((p) => ({ ...p, unit: true }));
                  }}
                />
              ))}
            </View>
          </Group>

          <Group label="When does it go off?">
            <View style={styles.chips} accessibilityRole="radiogroup">
              {expiryPresets.map((p) => {
                const date = p.days === null ? null : daysFromToday(p.days);
                return (
                  <ChoiceChip
                    key={p.label}
                    label={p.label}
                    selected={draft.expiresOn === date}
                    onPress={() => {
                      update({ expiresOn: date });
                      setPicked((x) => ({ ...x, expiry: true }));
                    }}
                  />
                );
              })}
            </View>
            {draft.expiresOn && expiresIn !== null && (
              <View style={styles.stepper}>
                <RoundButton
                  label="A day earlier"
                  icon="minus"
                  onPress={() => {
                    update({ expiresOn: daysFromToday(Math.max(0, expiresIn - 1)) });
                    setPicked((x) => ({ ...x, expiry: true }));
                  }}
                />
                <Text style={styles.amount}>
                  {formatDate(draft.expiresOn)}
                  <Text style={styles.amountNote}>
                    {'  '}
                    {expiresIn === 0 ? 'today' : expiresIn === 1 ? 'tomorrow' : `in ${expiresIn} days`}
                  </Text>
                </Text>
                <RoundButton
                  label="A day later"
                  icon="plus"
                  onPress={() => {
                    update({ expiresOn: daysFromToday(expiresIn + 1) });
                    setPicked((x) => ({ ...x, expiry: true }));
                  }}
                />
              </View>
            )}
          </Group>

          <ErrorNote message={error} />
          <Button label={`Add to ${section?.name ?? 'kitchen'}`} onPress={save} busy={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingVertical: 8, gap: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saved: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: '#D7ECDF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
  },
  unknown: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.useSoonText,
    backgroundColor: colors.useSoon,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  group: { gap: 8 },
  groupLabel: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.ink },
  stickerRow: { gap: 8, paddingVertical: 2 },
  stickerChoice: { borderRadius: 999, padding: 3, borderWidth: 3, borderColor: 'transparent' },
  stickerChoiceOn: { borderColor: colors.tomato },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    padding: 8,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.sunflower,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.ink, textAlign: 'center', flex: 1 },
  amountNote: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
});
