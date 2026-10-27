import type { StickerName } from '../components/Sticker';

export type Guess = {
  sticker: StickerName;
  sectionId: string;
  unit: string;
  // Typical days until it goes off once home; null for food that keeps for months.
  shelfLifeDays: number | null;
};

type Rule = { words: string[] } & Guess;

// Checked in order, so more specific words come before general ones ("ice cream" before "cream").
const rules: Rule[] = [
  { words: ['ice cream', 'gelato', 'popsicle', 'sorbet'], sticker: 'iceCream', sectionId: 'freezer-desserts', unit: 'pint', shelfLifeDays: 120 },
  { words: ['frozen pizza', 'frozen meal', 'lasagna', 'burrito', 'dumpling', 'pot pie'], sticker: 'frozenMeal', sectionId: 'freezer-meals', unit: 'box', shelfLifeDays: 150 },
  { words: ['frozen pea', 'frozen corn', 'frozen veg', 'frozen broccoli', 'frozen berr', 'peas'], sticker: 'peas', sectionId: 'freezer-vegetables', unit: 'bag', shelfLifeDays: 240 },
  { words: ['cream cheese'], sticker: 'cheese', sectionId: 'fridge-dairy', unit: 'oz', shelfLifeDays: 21 },
  { words: ['sour cream'], sticker: 'sourCream', sectionId: 'fridge-dairy', unit: 'tub', shelfLifeDays: 14 },
  { words: ['peanut butter', 'almond butter', 'jam', 'jelly', 'honey', 'nutella', 'salsa', 'pickle', 'olive'], sticker: 'jar', sectionId: 'pantry-snacks', unit: 'jar', shelfLifeDays: null },
  { words: ['butter', 'margarine'], sticker: 'butter', sectionId: 'fridge-dairy', unit: 'sticks', shelfLifeDays: 60 },
  { words: ['milk', 'creamer', 'half and half', 'cream'], sticker: 'milk', sectionId: 'fridge-dairy', unit: 'gal', shelfLifeDays: 7 },
  { words: ['egg'], sticker: 'eggs', sectionId: 'fridge-dairy', unit: 'eggs', shelfLifeDays: 21 },
  { words: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'swiss', 'brie', 'feta'], sticker: 'cheese', sectionId: 'fridge-dairy', unit: 'oz', shelfLifeDays: 28 },
  { words: ['yogurt', 'yoghurt', 'cottage'], sticker: 'yogurt', sectionId: 'fridge-dairy', unit: 'cups', shelfLifeDays: 14 },
  { words: ['leftover'], sticker: 'leftovers', sectionId: 'fridge-leftovers', unit: 'container', shelfLifeDays: 4 },
  { words: ['chicken', 'beef', 'steak', 'pork', 'turkey', 'bacon', 'sausage', 'ham', 'salmon', 'fish', 'shrimp', 'meat'], sticker: 'drumstick', sectionId: 'fridge-meats', unit: 'lb', shelfLifeDays: 3 },
  { words: ['juice', 'soda', 'water', 'beer', 'wine', 'lemonade', 'kombucha', 'tea'], sticker: 'juice', sectionId: 'fridge-drinks', unit: 'bottle', shelfLifeDays: 10 },
  { words: ['spinach', 'lettuce', 'kale', 'arugula', 'salad', 'greens', 'cilantro', 'parsley', 'basil leaves'], sticker: 'spinach', sectionId: 'fridge-produce', unit: 'oz', shelfLifeDays: 5 },
  { words: ['carrot', 'celery', 'pepper', 'broccoli', 'cucumber', 'zucchini', 'tomato', 'onion', 'apple', 'berr', 'grape', 'lemon', 'lime', 'orange', 'fruit', 'vegetable'], sticker: 'carrot', sectionId: 'fridge-produce', unit: 'count', shelfLifeDays: 10 },
  { words: ['ketchup', 'mustard', 'mayo', 'dressing', 'sauce', 'sriracha', 'relish'], sticker: 'ketchup', sectionId: 'fridge-condiments', unit: 'bottle', shelfLifeDays: null },
  { words: ['bean', 'soup', 'tuna', 'canned', 'corn', 'tomato sauce', 'broth'], sticker: 'can', sectionId: 'pantry-canned', unit: 'cans', shelfLifeDays: null },
  { words: ['pasta', 'spaghetti', 'noodle', 'macaroni', 'rice', 'quinoa', 'oat', 'cereal', 'bread', 'tortilla'], sticker: 'pasta', sectionId: 'pantry-grains', unit: 'box', shelfLifeDays: null },
  { words: ['chip', 'cracker', 'cookie', 'pretzel', 'popcorn', 'granola', 'bar', 'nut', 'candy', 'chocolate'], sticker: 'chips', sectionId: 'pantry-snacks', unit: 'bag', shelfLifeDays: null },
  { words: ['flour', 'sugar', 'baking', 'yeast', 'cocoa', 'vanilla', 'cornstarch'], sticker: 'flour', sectionId: 'pantry-baking', unit: 'bag', shelfLifeDays: null },
  { words: ['salt', 'pepper', 'spice', 'cinnamon', 'paprika', 'cumin', 'oregano', 'garlic powder', 'dried', 'seasoning'], sticker: 'spices', sectionId: 'pantry-spices', unit: 'jar', shelfLifeDays: null },
];

const fallback: Guess = { sticker: 'can', sectionId: 'pantry-canned', unit: 'count', shelfLifeDays: null };

// Guesses the picture, section, unit, and shelf life from what someone typed or a product's name.
// Returns null when nothing matches, so the form can keep whatever the person already picked.
export function guessFromName(text: string): Guess | null {
  const name = text.toLowerCase();
  if (!name.trim()) return null;
  for (const rule of rules) {
    if (rule.words.some((w) => name.includes(w))) {
      const { words: _words, ...guess } = rule;
      return guess;
    }
  }
  return null;
}

export function guessOrFallback(text: string): Guess {
  return guessFromName(text) ?? fallback;
}

// Units offered as quick picks in the add form.
export const commonUnits = ['count', 'lb', 'oz', 'gal', 'bottle', 'bag', 'box', 'jar', 'cans', 'container'];

// Everyday foods offered as search suggestions before anything is looked up online.
export const commonFoods = [
  'Milk', 'Eggs', 'Butter', 'Cheddar cheese', 'Shredded mozzarella', 'Greek yogurt', 'Sour cream', 'Cream cheese',
  'Half and half', 'Chicken breasts', 'Chicken thighs', 'Ground beef', 'Steak', 'Pork chops', 'Bacon', 'Sausage',
  'Deli turkey', 'Ham', 'Salmon', 'Shrimp', 'Leftovers', 'Orange juice', 'Apple juice', 'Sparkling water', 'Beer',
  'White wine', 'Spinach', 'Lettuce', 'Kale', 'Carrots', 'Celery', 'Bell peppers', 'Broccoli', 'Cucumber',
  'Tomatoes', 'Onions', 'Apples', 'Strawberries', 'Blueberries', 'Grapes', 'Lemons', 'Limes', 'Cilantro',
  'Ketchup', 'Mustard', 'Mayo', 'Ranch dressing', 'Hot sauce', 'Frozen peas', 'Frozen corn', 'Frozen broccoli',
  'Frozen berries', 'Frozen pizza', 'Ice cream', 'Black beans', 'Chicken broth', 'Canned tomatoes', 'Tuna',
  'Spaghetti', 'Rice', 'Oats', 'Cereal', 'Bread', 'Tortillas', 'Chips', 'Crackers', 'Peanut butter', 'Jam',
  'Honey', 'Flour', 'Sugar', 'Brown sugar', 'Baking soda', 'Salt', 'Black pepper', 'Cinnamon', 'Garlic powder',
];

export function matchCommonFoods(query: string, limit = 4): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const starts = commonFoods.filter((f) => f.toLowerCase().startsWith(q));
  const contains = commonFoods.filter((f) => !f.toLowerCase().startsWith(q) && f.toLowerCase().includes(q));
  return [...starts, ...contains].slice(0, limit);
}
