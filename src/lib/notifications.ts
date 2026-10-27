import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { defaultReminderSettings, type Digest, type ItemReminder, type ReminderSettings } from '../data/reminders';

// Reminders are local notifications scheduled on this phone from the kitchen's current food.
// They're rebuilt whenever the food changes, so each phone keeps its own up-to-date schedule.

const SETTINGS_KEY = 'reminder-settings';
const ITEM_REMINDERS_KEY = 'item-reminders';
const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultReminderSettings, ...(JSON.parse(raw) as Partial<ReminderSettings>) } : defaultReminderSettings;
  } catch {
    return defaultReminderSettings;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadItemReminders(): Promise<ItemReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(ITEM_REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as ItemReminder[]) : [];
  } catch {
    return [];
  }
}

export async function saveItemReminders(reminders: ItemReminder[]): Promise<void> {
  await AsyncStorage.setItem(ITEM_REMINDERS_KEY, JSON.stringify(reminders));
}

export type ScheduledNote = { date: Date; title: string; body: string; url: string };

export type PermissionState = 'granted' | 'undetermined' | 'denied' | 'unsupported';

export async function reminderPermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

export async function askReminderPermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: false, allowBadge: false },
  });
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

export async function scheduleReminders(notes: ScheduledNote[]): Promise<void> {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (notes.length === 0 || (await reminderPermission()) !== 'granted') return;
  for (const n of notes) {
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { url: n.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date },
    });
  }
}

export function digestNotes(digests: Digest[]): ScheduledNote[] {
  return digests.map((d) => ({ ...d, url: '/list' }));
}
