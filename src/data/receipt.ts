import { guessFromName, guessOrFallback, type Guess } from './guess';

// Turns the text read off a grocery receipt into items to review. The reader that
// produces the text is swappable (on-phone text reading today, an AI reader later);
// everything after it, including the flags, works the same.

export type ReceiptItem = {
  key: string;
  // The line as printed, shown so people can tell what "GV WHL MLK" was.
  raw: string;
  name: string;
  guess: Guess;
  quantity: number;
  unit: string;
  // 'weight': sold by the pound but no weight was printed, so someone has to enter it.
  // 'unknown': we couldn't tell what it is, so someone has to search or rename it.
  flag: 'weight' | 'unknown' | null;
};

const SKIP_WORDS = [
  'SUBTOTAL', 'SUB TOTAL', 'TOTAL', 'TAX', 'BALANCE', 'CHANGE', 'CASH', 'VISA', 'MASTERCARD', 'AMEX', 'DISCOVER',
  'DEBIT', 'CREDIT', 'CARD', 'AMOUNT', 'SAVINGS', 'YOU SAVED', 'SAVED', 'COUPON', 'DISCOUNT', 'THANK', 'STORE',
  'MANAGER', 'TEL', 'PHONE', 'WWW', '.COM', 'ITEMS SOLD', 'ITEM COUNT', 'AUTH', 'APPROVED', 'REF', 'TERMINAL',
  'CASHIER', 'MEMBER', 'REWARD', 'POINTS', 'BAG FEE', 'DEPOSIT', 'RECEIPT', 'RETURN', 'SURVEY', 'PAYMENT', 'TENDER',
  'ACCOUNT', 'CHIP READ', 'APPROVAL', 'TRANS', 'REG ', 'LANE', 'ORDER', 'PRICE', 'REGULAR', 'SALE', 'BOGO', 'VOID',
];

// Common receipt shorthand, matched as whole words. Kept to food words so it can't mangle store names.
const ABBREVIATIONS: Record<string, string> = {
  GV: 'Great Value', KS: 'Kirkland Signature', ORG: 'Organic', ORGNC: 'Organic', NAT: 'Natural',
  MLK: 'Milk', WHL: 'Whole', SKM: 'Skim', '2PCT': '2%', CRM: 'Cream', SR: 'Sour', HVY: 'Heavy',
  CHS: 'Cheese', CHSE: 'Cheese', SHRD: 'Shredded', SHRED: 'Shredded', MOZZ: 'Mozzarella', MOZZARELLA: 'Mozzarella',
  CHED: 'Cheddar', CHDR: 'Cheddar', PARM: 'Parmesan', AMER: 'American', BTR: 'Butter', UNSLTD: 'Unsalted',
  YGRT: 'Yogurt', YOG: 'Yogurt', YGT: 'Yogurt', GRK: 'Greek', LG: 'Large', XL: 'Extra large', DZ: 'Dozen',
  EGG: 'Eggs', EGGS: 'Eggs', CHKN: 'Chicken', CHK: 'Chicken', CKN: 'Chicken', BRST: 'Breast', BRS: 'Breast',
  THGH: 'Thighs', THGHS: 'Thighs', GRD: 'Ground', GRND: 'Ground', BF: 'Beef', BNLS: 'Boneless', SKNLS: 'Skinless',
  SAUS: 'Sausage', BCN: 'Bacon', TRKY: 'Turkey', TKY: 'Turkey', SLMN: 'Salmon', SHRMP: 'Shrimp', STK: 'Steak',
  PRK: 'Pork', CHP: 'Chop', CHPS: 'Chips', DELI: 'Deli', OJ: 'Orange juice', JCE: 'Juice', JC: 'Juice',
  BRD: 'Bread', WHT: 'White', WHEAT: 'Wheat', WW: 'Whole wheat', TORT: 'Tortillas', VEG: 'Vegetables',
  FRZ: 'Frozen', FZN: 'Frozen', FRZN: 'Frozen', PNT: 'Peanut', PB: 'Peanut butter', BNS: 'Beans', BLK: 'Black',
  TOM: 'Tomatoes', TOMS: 'Tomatoes', POT: 'Potatoes', POTS: 'Potatoes', ONN: 'Onions', ONIONS: 'Onions',
  BAN: 'Bananas', BANANA: 'Bananas', BANANAS: 'Bananas', APPL: 'Apples', APL: 'Apples', STRWB: 'Strawberries',
  STRAWB: 'Strawberries', BLUEB: 'Blueberries', BLBRY: 'Blueberries', LETT: 'Lettuce', ROM: 'Romaine',
  SPNCH: 'Spinach', SPIN: 'Spinach', BROC: 'Broccoli', CARR: 'Carrots', CRRT: 'Carrots', CELRY: 'Celery',
  PPR: 'Peppers', PEPR: 'Peppers', GRN: 'Green', AVO: 'Avocado', AVOC: 'Avocado', CUKE: 'Cucumber',
  PSTA: 'Pasta', SPAG: 'Spaghetti', RCE: 'Rice', CRL: 'Cereal', CRKR: 'Crackers', CRKRS: 'Crackers',
  CKY: 'Cookies', CKIES: 'Cookies', ICE: 'Ice', ICECRM: 'Ice cream', WTR: 'Water', SPKL: 'Sparkling', SDA: 'Soda',
  FLR: 'Flour', SGR: 'Sugar', KETCH: 'Ketchup', KTCHP: 'Ketchup', MSTRD: 'Mustard', DRSG: 'Dressing',
  SCE: 'Sauce', SAUC: 'Sauce', BRTH: 'Broth', SOUP: 'Soup', CN: 'Canned', PZZA: 'Pizza', PIZ: 'Pizza',
};

// Sections whose food is usually priced by weight at the register.
const WEIGHED_SECTIONS = new Set(['fridge-produce', 'fridge-meats', 'freezer-meats']);
// Produce people usually buy by the each or the bag, which a receipt line already counts.
const SOLD_BY_COUNT = ['avocado', 'garlic', 'pineapple', 'melon', 'squash', 'cucumber', 'lettuce', 'romaine', 'celery', 'bag', 'pack', 'pkg', 'bunch', 'ct', 'cilantro', 'parsley', 'spinach'];
// Words that mean the price was weighed, e.g. "DELI TURKEY" or "BULK RICE".
const WEIGHED_WORDS = ['deli', 'bulk', 'loose', 'by the lb', 'per lb'];

// Units that describe a package, which is what a receipt line counts. Anything else (oz of cheese,
// cups of yogurt) becomes "pack" so "2 @ 1.00" reads as two packs, not two ounces.
const PACKAGE_UNITS = new Set(['count', 'gal', 'bottle', 'bag', 'box', 'jar', 'cans', 'tub', 'pint', 'container']);

const PRICE = /-?\$?\d{1,4}[.,]\d{2}\s*-?[A-Z]{0,2}$/;
const WEIGHT_LINE = /(\d+(?:\.\d+)?)\s*(LB|LBS|KG|OZ)\b/;
const COUNT_PREFIX = /^(\d{1,2})\s*(?:@|X)\s*/;
const COUNT_LINE = /^(\d{1,2})\s*(?:@|X)\s*\$?\d/;

function titleCase(text: string): string {
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function decodeName(text: string): string {
  const words = text
    .replace(/[^A-Z0-9%&' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    // Item codes ("4011", "000000004011KF") and sizes ("16OZ", "GAL") don't help name the food.
    .filter((w) => !/^\d{3,}[A-Z]{0,2}$/.test(w) && !/^\d*(OZ|FL|CT|PK|LB|LBS|GAL|L|ML|G|EA)$/.test(w));
  // Tax and discount codes printed after the item, like the "F" or "N" in "MILK 1234 F 3.48 N".
  while (words.length > 1 && /^[A-Z]{1,2}$/.test(words[words.length - 1]) && !ABBREVIATIONS[words[words.length - 1]]) words.pop();
  const decoded = words.map((w) => ABBREVIATIONS[w] ?? w).join(' ');
  // Phrases that read better joined up.
  return titleCase(
    decoded
      .replace(/\bPeanut Peanut butter\b/i, 'Peanut butter')
      .replace(/\bSour Cream\b/i, 'Sour cream')
      .replace(/\bIce Cream\b/i, 'Ice cream')
      .replace(/\s+/g, ' ')
      .trim(),
  ).slice(0, 100);
}

function isSkippable(line: string): boolean {
  const letters = line.replace(/[^A-Z]/g, '');
  if (letters.length < 3) return true;
  if (SKIP_WORDS.some((w) => line.includes(w))) return true;
  // Dates, times, phone numbers, and card numbers.
  if (/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(line) || /\d{1,2}:\d{2}/.test(line)) return true;
  if (/\*{3,}|X{4,}\d/.test(line)) return true;
  // Mostly digits: barcodes and transaction numbers.
  const digits = line.replace(/\D/g, '').length;
  return digits > letters.length * 2;
}

function needsWeight(name: string, guess: Guess | null): boolean {
  const lower = name.toLowerCase();
  if (WEIGHED_WORDS.some((w) => lower.includes(w))) return true;
  if (!guess || !WEIGHED_SECTIONS.has(guess.sectionId)) return false;
  return !SOLD_BY_COUNT.some((w) => lower.includes(w));
}

export function parseReceipt(blocks: string[]): ReceiptItem[] {
  const lines = blocks
    .flatMap((b) => b.split('\n'))
    .map((l) => l.toUpperCase().replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const items: ReceiptItem[] = [];
  const weightApplied = new Set<string>();

  for (const line of lines) {
    const last = items[items.length - 1];

    // "1.32 LB @ 2.99 /LB" belongs to the item above it.
    const weight = line.match(WEIGHT_LINE);
    if (weight && last && !weightApplied.has(last.key) && (line.includes('@') || line.replace(PRICE, '').replace(WEIGHT_LINE, '').replace(/[^A-Z]/g, '').length < 4)) {
      const amount = Number(weight[1]);
      const unit = weight[2] === 'LBS' ? 'lb' : weight[2].toLowerCase();
      if (amount > 0) {
        last.quantity = amount;
        last.unit = unit;
        if (last.flag === 'weight') last.flag = null;
        weightApplied.add(last.key);
      }
      continue;
    }

    // "2 @ 1.99" on its own line sets the count of the item above.
    const countLine = line.match(COUNT_LINE);
    if (countLine && last && line.replace(PRICE, '').replace(/[^A-Z]/g, '').length < 3) {
      last.quantity = Number(countLine[1]);
      continue;
    }

    if (isSkippable(line)) continue;

    let text = line.replace(PRICE, '').trim();
    let quantity = 1;
    const count = text.match(COUNT_PREFIX);
    if (count) {
      quantity = Number(count[1]);
      text = text.replace(COUNT_PREFIX, '');
    }
    if (text.replace(/[^A-Z]/g, '').length < 3) continue;

    const name = decodeName(text);
    const guess = guessFromName(name);
    const fallback = guess ?? guessOrFallback(name);
    const weighed = needsWeight(name, guess);
    // Eggs print their count: "EGGS LG 18CT".
    const eggCount = fallback.unit === 'eggs' ? text.match(/\b(\d{1,2})\s*CT\b/) : null;
    if (eggCount) quantity *= Number(eggCount[1]);
    const unit = weighed ? 'lb' : eggCount ? 'eggs' : PACKAGE_UNITS.has(fallback.unit) ? fallback.unit : 'pack';
    items.push({
      key: `${items.length}-${text}`,
      raw: line,
      name,
      guess: fallback,
      quantity,
      unit,
      flag: !guess ? 'unknown' : weighed ? 'weight' : null,
    });
  }

  // Store header lines (name, address) come before the first priced item and rarely match food.
  while (items.length > 0 && items[0].flag === 'unknown' && !PRICE.test(items[0].raw)) items.shift();
  return items;
}
