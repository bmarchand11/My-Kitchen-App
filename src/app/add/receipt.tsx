import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ProductSearch, type Suggestion } from '../../components/ProductSearch';
import { ReminderOffer, reminderOffers } from '../../components/ReminderOffer';
import { Sticker, type StickerName } from '../../components/Sticker';
import { BackButton, Button, ChoiceChip, CloseButton, ErrorNote, Field, Screen, Title } from '../../components/ui';
import { commonUnits, guessFromName } from '../../data/guess';
import { daysFromToday, formatQuantity, locations, quantityStep, sectionById, sections } from '../../data/kitchen';
import { useKitchen } from '../../data/KitchenContext';
import { useReminders } from '../../data/RemindersContext';
import { parseReceipt } from '../../data/receipt';
import { errorMessage } from '../../lib/errors';
import { canReadReceipts, readReceipt } from '../../lib/receiptReader';
import { colors, fonts } from '../../theme';

type Row = {
  key: string;
  raw: string;
  name: string;
  sticker: StickerName;
  sectionId: string;
  quantity: number;
  unit: string;
  shelfLifeDays: number | null;
  flag: 'weight' | 'unknown' | null;
};

const flagText = { weight: 'Enter the weight', unknown: 'What is this?' } as const;

function toRows(blocks: string[], startAt: number): Row[] {
  return parseReceipt(blocks).map((item, i) => ({
    key: `${startAt + i}-${item.key}`,
    raw: item.raw,
    name: item.name,
    sticker: item.guess.sticker,
    sectionId: item.guess.sectionId,
    quantity: item.quantity,
    unit: item.unit,
    shelfLifeDays: item.guess.shelfLifeDays,
    flag: item.flag,
  }));
}

function RowEditor({
  row,
  onChange,
  onRemove,
  onDone,
}: {
  row: Row;
  onChange: (changes: Partial<Row>) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const [searching, setSearching] = useState(row.flag === 'unknown');
  const [amountText, setAmountText] = useState(formatAmount(row.quantity));
  const section = sectionById(row.sectionId);
  const locationId = section?.locationId ?? 'fridge';
  const units = commonUnits.includes(row.unit) ? commonUnits : [row.unit, ...commonUnits];

  const setAmount = (quantity: number) => {
    setAmountText(formatAmount(quantity));
    onChange({ quantity, flag: row.flag === 'weight' ? null : row.flag });
  };

  const pick = (s: Suggestion) => {
    setSearching(false);
    onChange({ name: s.name, sticker: s.sticker, sectionId: s.sectionId, shelfLifeDays: s.shelfLifeDays, flag: null });
  };

  return (
    <View style={styles.editor}>
      <Field
        label="Name"
        value={row.name}
        onChangeText={(name) => {
          setSearching(true);
          const guess = guessFromName(name);
          onChange({
            name,
            flag: row.flag === 'unknown' ? null : row.flag,
            ...(guess ? { sticker: guess.sticker, sectionId: guess.sectionId, shelfLifeDays: guess.shelfLifeDays } : {}),
          });
        }}
        placeholder="Search or type a name"
        maxLength={100}
      />
      {searching && <ProductSearch query={row.name} onPick={pick} />}

      <Text style={styles.editorLabel}>{row.flag === 'weight' ? 'How much? Check the package or sticker.' : 'How much?'}</Text>
      <View style={styles.amountRow}>
        <RoundButton icon="minus" label="Less" onPress={() => setAmount(Math.max(quantityStep(row.unit), +(row.quantity - quantityStep(row.unit)).toFixed(2)))} />
        <TextInput
          accessibilityLabel="Amount"
          value={amountText}
          onChangeText={(t) => {
            setAmountText(t);
            const n = Number(t.replace(',', '.'));
            if (n > 0) onChange({ quantity: n, flag: row.flag === 'weight' ? null : row.flag });
          }}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={styles.amountInput}
        />
        <RoundButton icon="plus" label="More" onPress={() => setAmount(+(row.quantity + quantityStep(row.unit)).toFixed(2))} />
      </View>
      <View style={styles.chips}>
        {units.map((u) => (
          <ChoiceChip key={u} label={u} selected={u === row.unit} onPress={() => onChange({ unit: u })} />
        ))}
      </View>

      <Text style={styles.editorLabel}>Where does it go?</Text>
      <View style={styles.chips}>
        {locations.map((l) => (
          <ChoiceChip
            key={l.id}
            label={l.name}
            selected={l.id === locationId}
            onPress={() => {
              const first = sections.find((s) => s.locationId === l.id);
              if (first && l.id !== locationId) onChange({ sectionId: first.id });
            }}
          />
        ))}
      </View>
      <View style={styles.chips}>
        {sections
          .filter((s) => s.locationId === locationId)
          .map((s) => (
            <ChoiceChip key={s.id} label={s.name} selected={s.id === row.sectionId} onPress={() => onChange({ sectionId: s.id })} />
          ))}
      </View>

      <View style={styles.editorActions}>
        <Pressable accessibilityRole="button" onPress={onRemove} style={styles.remove}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            label={row.flag ? 'Looks right' : 'Done'}
            onPress={() => {
              onChange({ flag: null });
              onDone();
            }}
          />
        </View>
      </View>
    </View>
  );
}

function formatAmount(n: number): string {
  return String(+n.toFixed(2));
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

export default function ReceiptScreen() {
  const { addItems } = useKitchen();
  const { settings: reminderSettings } = useReminders();
  const [offers, setOffers] = useState<ReturnType<typeof reminderOffers> | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');

  const addRows = (blocks: string[]) => {
    const found = toRows(blocks, rows?.length ?? 0);
    if (found.length === 0) {
      setError('We couldn’t find any food on that receipt. Try again flat and in bright light, or add items with search.');
      return;
    }
    setRows((prev) => [...(prev ?? []), ...found]);
    setOpen(null);
  };

  const scan = async (source: 'camera' | 'library') => {
    setError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError('My Kitchen needs the camera to read receipts. You can turn it on in Settings, or choose a photo instead.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
      const result =
        source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      setReading(true);
      addRows(await readReceipt(result.assets[0].uri));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setReading(false);
    }
  };

  const change = (key: string, changes: Partial<Row>) =>
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...changes } : r)) ?? null);

  const flagged = rows?.filter((r) => r.flag) ?? [];

  const save = async () => {
    if (!rows) return;
    setError(null);
    if (flagged.length > 0) {
      setOpen(flagged[0].key);
      setError(
        flagged.length === 1
          ? 'One item still needs you. Fill it in, or remove it.'
          : `${flagged.length} items still need you. Fill them in, or remove them.`,
      );
      return;
    }
    setSaving(true);
    try {
      const newItems = rows
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name,
          sticker: r.sticker,
          sectionId: r.sectionId,
          quantity: r.quantity,
          unit: r.unit,
          expiresOn: r.shelfLifeDays === null ? null : daysFromToday(r.shelfLifeDays),
        }));
      const ids = await addItems(newItems);
      const quick = reminderOffers(
        ids.map((itemId, i) => ({ itemId, name: newItems[i].name, sticker: newItems[i].sticker, expiresOn: newItems[i].expiresOn })),
        reminderSettings.hour,
      );
      if (quick.length > 0) setOffers(quick);
      else router.dismissTo('/');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const photoButtons = canReadReceipts && (
    <View style={styles.buttons}>
      <Button label={rows ? 'Add another photo' : 'Take a photo'} onPress={() => scan('camera')} busy={reading} variant={rows ? 'secondary' : 'primary'} />
      {!rows && <Button label="Choose from photos" variant="secondary" onPress={() => scan('library')} />}
    </View>
  );

  return (
    <Screen showBottomBar={false}>
      <View style={styles.header}>
        <BackButton label="Add food" />
        <CloseButton />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Title>Scan a receipt</Title>

        {!rows && (
          <>
            <Text style={styles.note}>
              Lay the receipt flat in good light. For a long receipt, take the top half first, then add another photo.
            </Text>
            {photoButtons}
            {!canReadReceipts && (
              <View style={styles.buttons}>
                <Text style={styles.note}>
                  Reading receipt photos works in the full My Kitchen app. Here you can paste the receipt’s text instead.
                </Text>
                <Field label="Receipt text" value={pasted} onChangeText={setPasted} multiline style={styles.paste} />
                <Button label="Read text" onPress={() => addRows(pasted.split('\n'))} />
              </View>
            )}
            {reading && <ActivityIndicator color={colors.ink} />}
          </>
        )}

        {rows && (
          <>
            <Text style={styles.summary}>
              Found {rows.length === 1 ? '1 item' : `${rows.length} items`}.{' '}
              {flagged.length === 0
                ? 'Tap any item to change it.'
                : flagged.length === 1
                  ? '1 needs you.'
                  : `${flagged.length} need you.`}
            </Text>
            {rows.map((r) => (
              <View key={r.key} style={[styles.row, r.flag && styles.rowFlagged]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${r.name}, ${formatQuantity(r.quantity)} ${r.unit}${r.flag ? `, ${flagText[r.flag]}` : ''}`}
                  onPress={() => setOpen(open === r.key ? null : r.key)}
                  style={styles.rowMain}
                >
                  <Sticker name={r.sticker} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName} numberOfLines={2}>
                      {r.name || 'Unnamed item'}
                    </Text>
                    <Text style={styles.rowRaw} numberOfLines={1}>
                      {r.raw}
                    </Text>
                    {r.flag && (
                      <View style={[styles.flag, r.flag === 'unknown' && { backgroundColor: colors.expired }]}>
                        <Text style={[styles.flagText, r.flag === 'unknown' && { color: colors.expiredText }]}>
                          {flagText[r.flag]}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowAmount}>
                    {r.flag === 'weight' ? '? lb' : `${formatQuantity(r.quantity)} ${r.unit}`}
                  </Text>
                </Pressable>
                {open === r.key && (
                  <RowEditor
                    row={r}
                    onChange={(c) => change(r.key, c)}
                    onRemove={() => setRows((prev) => prev?.filter((x) => x.key !== r.key) ?? null)}
                    onDone={() => setOpen(null)}
                  />
                )}
              </View>
            ))}
            {photoButtons}
          </>
        )}

        <ErrorNote message={error} />
        {rows && rows.length > 0 && (
          <Button
            label={flagged.length > 0 ? `Fill in ${flagged.length} flagged first` : `Add ${rows.length === 1 ? '1 item' : `${rows.length} items`}`}
            onPress={save}
            busy={saving}
          />
        )}
      </ScrollView>
      {offers && <ReminderOffer offers={offers} onDone={() => router.dismissTo('/')} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  body: { gap: 12, paddingBottom: 32 },
  note: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  buttons: { gap: 10 },
  paste: { minHeight: 140, textAlignVertical: 'top' },
  summary: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
  row: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink, borderRadius: 18, overflow: 'hidden' },
  rowFlagged: { borderColor: colors.tomato },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
  rowRaw: { fontFamily: fonts.body, fontSize: 12, color: colors.inkQuiet },
  rowAmount: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.ink },
  flag: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: colors.useSoon, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  flagText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.useSoonText },
  editor: { borderTopWidth: 2, borderTopColor: colors.divider, padding: 12, gap: 10 },
  editorLabel: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: {
    flex: 1,
    minWidth: 0,
    width: 0,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 6,
    backgroundColor: colors.background,
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editorActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  remove: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  removeText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.expiredText, textDecorationLine: 'underline' },
});
