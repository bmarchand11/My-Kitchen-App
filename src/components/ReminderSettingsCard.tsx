import { useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { useReminders } from '../data/RemindersContext';
import { reminderHours } from '../data/reminders';
import { colors, fonts } from '../theme';
import { Button, ChoiceChip, ErrorNote } from './ui';

export function ReminderSettingsCard() {
  const { settings, permission, update } = useReminders();
  const [error, setError] = useState<string | null>(null);

  const toggle = async (enabled: boolean) => {
    setError(null);
    const ok = await update({ enabled });
    if (!ok) setError('Notifications are off for My Kitchen. Turn them on in Settings, then try again.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Reminders</Text>
          <Text style={styles.body}>A daily heads-up on this phone when food is about to go off.</Text>
        </View>
        <Switch
          accessibilityLabel="Remind me about food to use soon"
          value={settings.enabled}
          onValueChange={toggle}
          disabled={permission === 'unsupported'}
          trackColor={{ true: colors.ink, false: colors.divider }}
          thumbColor={colors.surface}
        />
      </View>

      {settings.enabled && (
        <>
          <Text style={styles.label}>Remind me at</Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {reminderHours.map((h) => (
              <ChoiceChip key={h.hour} label={h.label} selected={settings.hour === h.hour} onPress={() => update({ hour: h.hour })} />
            ))}
          </View>
        </>
      )}

      {permission === 'unsupported' && <Text style={styles.body}>Reminders work in the iPhone app.</Text>}
      <ErrorNote message={error} />
      {error && permission === 'denied' && <Button label="Open Settings" variant="secondary" onPress={() => Linking.openSettings()} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
