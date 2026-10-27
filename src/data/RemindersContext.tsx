import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  askReminderPermission,
  digestNotes,
  loadItemReminders,
  loadReminderSettings,
  reminderPermission,
  saveItemReminders,
  saveReminderSettings,
  scheduleReminders,
  type PermissionState,
  type ScheduledNote,
} from '../lib/notifications';
import { useKitchen } from './KitchenContext';
import { buildDigests, defaultReminderSettings, itemReminderText, type ItemReminder, type ReminderSettings } from './reminders';

type RemindersValue = {
  settings: ReminderSettings;
  permission: PermissionState;
  // Turning reminders on asks for permission first; returns false if the person said no.
  update: (changes: Partial<ReminderSettings>) => Promise<boolean>;
  // Reminders for single items, offered when quick-spoiling food is added. Returns false if permission was refused.
  remindAbout: (reminders: ItemReminder[]) => Promise<boolean>;
};

const RemindersContext = createContext<RemindersValue | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { items, loading } = useKitchen();
  const [settings, setSettings] = useState<ReminderSettings>(defaultReminderSettings);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [itemReminders, setItemReminders] = useState<ItemReminder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadReminderSettings(), reminderPermission(), loadItemReminders()]).then(([s, p, r]) => {
      setSettings(s);
      setPermission(p);
      setItemReminders(r);
      setLoaded(true);
    });
  }, []);

  // Rebuild this phone's schedule whenever the food or the settings change.
  useEffect(() => {
    if (!loaded || loading) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      // Item reminders whose food was used up, thrown out, or is past are dropped.
      const live = itemReminders.filter((r) => {
        const item = items.find((i) => i.id === r.itemId);
        return item && item.quantity > 0 && item.expiresOn && new Date(r.at).getTime() > now;
      });
      if (live.length !== itemReminders.length) {
        setItemReminders(live);
        saveItemReminders(live).catch(() => {});
      }
      const itemNotes: ScheduledNote[] = live.map((r) => {
        const item = items.find((i) => i.id === r.itemId)!;
        const at = new Date(r.at);
        return { date: at, ...itemReminderText(item.name, at, item.expiresOn!), url: `/item/${item.id}` };
      });
      scheduleReminders([...itemNotes, ...digestNotes(buildDigests(items, settings))]).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [items, settings, itemReminders, loaded, loading]);

  // Tapping an item reminder opens that item; the daily reminder opens the list, where food to use soon is at the top.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      router.navigate(typeof url === 'string' && url.startsWith('/item/') ? (url as `/item/${string}`) : '/list');
    });
    return () => sub.remove();
  }, []);

  const update = useCallback(
    async (changes: Partial<ReminderSettings>) => {
      const next = { ...settings, ...changes };
      if (changes.enabled) {
        const p = permission === 'granted' ? 'granted' : await askReminderPermission();
        setPermission(p);
        if (p !== 'granted') return false;
      }
      setSettings(next);
      await saveReminderSettings(next);
      return true;
    },
    [settings, permission],
  );

  const remindAbout = useCallback(
    async (reminders: ItemReminder[]) => {
      const p = permission === 'granted' ? 'granted' : await askReminderPermission();
      setPermission(p);
      if (p !== 'granted') return false;
      const ids = new Set(reminders.map((r) => r.itemId));
      const next = [...itemReminders.filter((r) => !ids.has(r.itemId)), ...reminders];
      setItemReminders(next);
      await saveItemReminders(next);
      return true;
    },
    [permission, itemReminders],
  );

  return (
    <RemindersContext.Provider value={{ settings, permission, update, remindAbout }}>{children}</RemindersContext.Provider>
  );
}

export function useReminders(): RemindersValue {
  const value = useContext(RemindersContext);
  if (!value) throw new Error('useReminders must be used inside RemindersProvider');
  return value;
}
