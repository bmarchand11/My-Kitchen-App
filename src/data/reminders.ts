import { daysUntil, USE_SOON_DAYS, type Item } from './kitchen';

export type ReminderSettings = {
  enabled: boolean;
  // Hour of the day, 0-23, when the daily reminder arrives.
  hour: number;
};

export const defaultReminderSettings: ReminderSettings = { enabled: false, hour: 17 };

export const reminderHours = [
  { hour: 8, label: '8 AM' },
  { hour: 12, label: 'Noon' },
  { hour: 17, label: '5 PM' },
  { hour: 20, label: '8 PM' },
];

// How many days ahead to schedule. Reminders are rebuilt each time the app opens or the
// food changes, so this only matters when nobody opens the app for a while.
export const DAYS_AHEAD = 14;

export type Digest = { date: Date; title: string; body: string };

function when(days: number): string {
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

function list(names: string[]): string {
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
}

// One reminder per day that has food going off within the use-soon window, worded for that day.
// Food that has already expired is mentioned once, in the first reminder.
export function buildDigests(items: Item[], settings: ReminderSettings, now = new Date()): Digest[] {
  if (!settings.enabled) return [];
  const tracked = items.filter((i) => i.expiresOn && i.quantity > 0);
  const digests: Digest[] = [];

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, settings.hour, 0, 0);
    if (date.getTime() <= now.getTime()) continue;

    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const soon = tracked
      .map((i) => ({ item: i, days: daysUntil(i.expiresOn!, dayStart) }))
      .filter(({ days }) => days >= 0 && days <= USE_SOON_DAYS)
      .sort((a, b) => a.days - b.days);
    const expired = digests.length === 0 ? tracked.filter((i) => daysUntil(i.expiresOn!, dayStart) < 0) : [];
    if (soon.length === 0 && expired.length === 0) continue;

    const first = soon[0];
    const title =
      soon.length === 0
        ? `${expired.length === 1 ? '1 item has' : `${expired.length} items have`} expired`
        : soon.length === 1
          ? `Use your ${first.item.name.toLowerCase()} ${when(first.days)}`
          : `${soon.length} things to use soon`;
    const parts: string[] = [];
    if (soon.length > 1) parts.push(list(soon.map(({ item, days }) => `${item.name} (${when(days)})`)));
    if (expired.length > 0) parts.push(`Past their date: ${list(expired.map((i) => i.name))}`);
    if (parts.length === 0) parts.push('Open My Kitchen to see what to cook.');
    digests.push({ date, title, body: parts.join('. ') });
  }
  return digests;
}

// Food that goes off within this many days gets offered its own reminder when it's added.
export const QUICK_SPOIL_DAYS = 7;

export type ItemReminder = { itemId: string; name: string; at: string };

// The recommended reminder: the day before it goes off, at the person's reminder time.
// Falls back to the morning it goes off when the day before has already passed.
export function recommendedReminder(expiresOn: string | null, hour: number, now = new Date()): Date | null {
  if (!expiresOn) return null;
  const days = daysUntil(expiresOn, now);
  if (days < 0 || days > QUICK_SPOIL_DAYS) return null;
  const dayBefore = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days - 1, hour, 0, 0);
  if (dayBefore.getTime() > now.getTime()) return dayBefore;
  const morningOf = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, Math.min(hour, 9), 0, 0);
  return morningOf.getTime() > now.getTime() ? morningOf : null;
}

export function describeReminder(at: Date, now = new Date(), short = false): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
  const diff = Math.round((day - today) / (24 * 60 * 60 * 1000));
  const time = at.toLocaleTimeString('en-US', { hour: 'numeric', minute: at.getMinutes() ? '2-digit' : undefined });
  const dayText =
    diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : at.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long', month: 'short', day: 'numeric' });
  return `${dayText} at ${time}`;
}

export function itemReminderText(name: string, at: Date, expiresOn: string): { title: string; body: string } {
  const days = daysUntil(expiresOn, at);
  return {
    title: `Use your ${name.toLowerCase()} ${days <= 0 ? 'today' : 'by tomorrow'}`,
    body: days <= 0 ? 'It goes off today.' : 'It goes off tomorrow. Tap to see it in your kitchen.',
  };
}
