import type { StickerName } from '../components/Sticker';

export type LocationId = 'fridge' | 'freezer' | 'pantry';

export type Location = {
  id: LocationId;
  name: string;
};

export type Section = {
  id: string;
  locationId: LocationId;
  name: string;
  sticker: StickerName;
  // Drawers and door racks are drawn differently from plain shelves.
  style: 'shelf' | 'drawer' | 'door';
};

export type Item = {
  id: string;
  name: string;
  sticker: StickerName;
  sectionId: string;
  quantity: number;
  unit: string;
  // Calendar dates as YYYY-MM-DD; null when the food doesn't go off soon enough to track.
  expiresOn: string | null;
  addedOn: string;
  addedBy: string;
};

export const USE_SOON_DAYS = 3;

export const locations: Location[] = [
  { id: 'fridge', name: 'Fridge' },
  { id: 'freezer', name: 'Freezer' },
  { id: 'pantry', name: 'Pantry' },
];

export const sections: Section[] = [
  { id: 'fridge-dairy', locationId: 'fridge', name: 'Dairy', sticker: 'milk', style: 'shelf' },
  { id: 'fridge-meats', locationId: 'fridge', name: 'Meats', sticker: 'drumstick', style: 'shelf' },
  { id: 'fridge-leftovers', locationId: 'fridge', name: 'Leftovers', sticker: 'leftovers', style: 'shelf' },
  { id: 'fridge-drinks', locationId: 'fridge', name: 'Drinks', sticker: 'juice', style: 'shelf' },
  { id: 'fridge-produce', locationId: 'fridge', name: 'Produce drawer', sticker: 'carrot', style: 'drawer' },
  { id: 'fridge-condiments', locationId: 'fridge', name: 'Condiments', sticker: 'ketchup', style: 'door' },
  { id: 'freezer-meats', locationId: 'freezer', name: 'Meats', sticker: 'drumstick', style: 'drawer' },
  { id: 'freezer-vegetables', locationId: 'freezer', name: 'Vegetables', sticker: 'peas', style: 'drawer' },
  { id: 'freezer-meals', locationId: 'freezer', name: 'Frozen meals', sticker: 'frozenMeal', style: 'drawer' },
  { id: 'freezer-desserts', locationId: 'freezer', name: 'Ice cream and desserts', sticker: 'iceCream', style: 'drawer' },
  { id: 'pantry-canned', locationId: 'pantry', name: 'Canned goods', sticker: 'can', style: 'shelf' },
  { id: 'pantry-grains', locationId: 'pantry', name: 'Grains and pasta', sticker: 'pasta', style: 'shelf' },
  { id: 'pantry-snacks', locationId: 'pantry', name: 'Snacks', sticker: 'chips', style: 'shelf' },
  { id: 'pantry-baking', locationId: 'pantry', name: 'Baking', sticker: 'flour', style: 'shelf' },
  { id: 'pantry-spices', locationId: 'pantry', name: 'Herbs and spices', sticker: 'spices', style: 'shelf' },
];

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysFromToday(days: number, today = new Date()): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
  return toDateString(date);
}

export function daysUntil(dateString: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseDate(dateString).getTime() - start.getTime()) / msPerDay);
}

export type Freshness = 'fresh' | 'useSoon' | 'expired';

export function freshness(item: Item, today = new Date()): Freshness {
  if (!item.expiresOn) return 'fresh';
  const days = daysUntil(item.expiresOn, today);
  if (days < 0) return 'expired';
  if (days <= USE_SOON_DAYS) return 'useSoon';
  return 'fresh';
}

export function expiryLabel(item: Item, today = new Date()): string {
  if (!item.expiresOn) return 'Keeps a long time';
  const days = daysUntil(item.expiresOn, today);
  if (days < -1) return `Expired ${-days} days ago`;
  if (days === -1) return 'Expired yesterday';
  if (days === 0) return 'Use today';
  if (days === 1) return 'Use by tomorrow';
  if (days <= USE_SOON_DAYS) return `Use in ${days} days`;
  if (days < 14) return `Good for ${days} days`;
  if (days < 60) return `Good for ${Math.round(days / 7)} weeks`;
  return `Good for ${Math.round(days / 30)} months`;
}

export function formatDate(dateString: string): string {
  return parseDate(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

export function formatQuantity(quantity: number): string {
  const whole = Math.floor(quantity);
  const part = FRACTIONS[String(Math.round((quantity - whole) * 100) / 100)];
  if (part) return whole > 0 ? `${whole}${part}` : part;
  return String(Math.round(quantity * 100) / 100);
}

export function sectionById(id: string): Section | undefined {
  return sections.find((s) => s.id === id);
}

export function locationById(id: string): Location | undefined {
  return locations.find((l) => l.id === id);
}

// Sample food so the app has something to show until accounts and real data arrive.
export function sampleItems(today = new Date()): Item[] {
  const added = daysFromToday(-3, today);
  const item = (
    id: string,
    name: string,
    sticker: StickerName,
    sectionId: string,
    quantity: number,
    unit: string,
    expiresInDays: number | null,
  ): Item => ({
    id,
    name,
    sticker,
    sectionId,
    quantity,
    unit,
    expiresOn: expiresInDays === null ? null : daysFromToday(expiresInDays, today),
    addedOn: added,
    addedBy: 'Brandon',
  });

  return [
    item('milk', '2% Milk', 'milk', 'fridge-dairy', 1, 'gal', 2),
    item('eggs', 'Eggs', 'eggs', 'fridge-dairy', 8, 'eggs', 21),
    item('cheddar', 'Cheddar', 'cheese', 'fridge-dairy', 8, 'oz', 28),
    item('yogurt', 'Greek yogurt', 'yogurt', 'fridge-dairy', 4, 'cups', 9),
    item('butter', 'Butter', 'butter', 'fridge-dairy', 2, 'sticks', 60),
    item('sour-cream', 'Sour cream', 'sourCream', 'fridge-dairy', 1, 'tub', 12),
    item('chicken-thighs', 'Chicken thighs', 'drumstick', 'fridge-meats', 1.5, 'lb', 2),
    item('turkey', 'Deli turkey', 'drumstick', 'fridge-meats', 0.75, 'lb', 5),
    item('chili', 'Leftover chili', 'leftovers', 'fridge-leftovers', 1, 'container', 3),
    item('orange-juice', 'Orange juice', 'juice', 'fridge-drinks', 1, 'bottle', 7),
    item('spinach', 'Spinach', 'spinach', 'fridge-produce', 5, 'oz', 1),
    item('carrots', 'Carrots', 'carrot', 'fridge-produce', 1, 'bag', 18),
    item('ketchup', 'Ketchup', 'ketchup', 'fridge-condiments', 1, 'bottle', null),
    item('ground-beef', 'Ground beef', 'drumstick', 'freezer-meats', 2, 'lb', 90),
    item('peas', 'Frozen peas', 'peas', 'freezer-vegetables', 2, 'bags', 240),
    item('lasagna', 'Frozen lasagna', 'frozenMeal', 'freezer-meals', 1, 'box', 150),
    item('ice-cream', 'Vanilla ice cream', 'iceCream', 'freezer-desserts', 1, 'pint', 120),
    item('black-beans', 'Black beans', 'can', 'pantry-canned', 3, 'cans', null),
    item('spaghetti', 'Spaghetti', 'pasta', 'pantry-grains', 2, 'boxes', null),
    item('rice', 'White rice', 'pasta', 'pantry-grains', 0.25, 'bag', null),
    item('peanut-butter', 'Peanut butter', 'jar', 'pantry-snacks', 1, 'jar', null),
    item('flour', 'Flour', 'flour', 'pantry-baking', 1, 'bag', null),
    item('basil', 'Dried basil', 'spices', 'pantry-spices', 1, 'jar', null),
  ];
}
