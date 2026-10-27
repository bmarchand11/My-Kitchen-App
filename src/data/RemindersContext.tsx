import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  askReminderPermission,
  loadReminderSettings,
  reminderPermission,
  saveReminderSettings,
  scheduleReminders,
  type PermissionState,
} from '../lib/notifications';
import { useKitchen } from './KitchenContext';
import { buildDigests, defaultReminderSettings, type ReminderSettings } from './reminders';

type RemindersValue = {
  settings: ReminderSettings;
  permission: PermissionState;
  // Turning reminders on asks for permission first; returns false if the person said no.
  update: (changes: Partial<ReminderSettings>) => Promise<boolean>;
};

const RemindersContext = createContext<RemindersValue | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { items, loading } = useKitchen();
  const [settings, setSettings] = useState<ReminderSettings>(defaultReminderSettings);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadReminderSettings(), reminderPermission()]).then(([s, p]) => {
      setSettings(s);
      setPermission(p);
      setLoaded(true);
    });
  }, []);

  // Rebuild this phone's schedule whenever the food or the settings change.
  useEffect(() => {
    if (!loaded || loading) return;
    const timer = setTimeout(() => {
      scheduleReminders(buildDigests(items, settings)).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [items, settings, loaded, loading]);

  // Tapping a reminder opens the list, where food to use soon is at the top.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/list'));
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

  return <RemindersContext.Provider value={{ settings, permission, update }}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersValue {
  const value = useContext(RemindersContext);
  if (!value) throw new Error('useReminders must be used inside RemindersProvider');
  return value;
}
