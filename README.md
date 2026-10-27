# My Kitchen

An iPhone app (built with Expo, so Android can follow) for keeping track of everything in your fridge, freezer, and pantry. Open a visual kitchen to see cartoon pictures of your food and how much is left, or switch to a list with exact quantities. Add food by typing, scanning a barcode, or snapping a grocery receipt, get reminders before things expire, and share one kitchen with your whole household.

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with your iPhone camera to open the app in [Expo Go](https://expo.dev/go).

## What's in the app so far

- Kitchen home with a fridge, freezer, and pantry you can tap to open
- Each location split into sections (dairy shelf, produce drawer, door racks, freezer bins, pantry shelves)
- Tap a section to zoom in on its food as sticker pictures, or switch to a list
- Item detail with + and − to change how much is left, plus "used it up" and "threw it out"
- A searchable list of everything, filterable by location, with food to use soon at the top
- Accounts (email and password) and households: start a kitchen, then share its 6-character invite code so others can join
- Food is saved in Supabase and syncs live between everyone in the household
- A new kitchen starts empty, with a button to load sample food
- Add food by typing it in: the picture, section, unit, and expiry date fill themselves in from the name, and you can change any of them
- Scan a barcode to fill in the name from Open Food Facts; your kitchen remembers products it has scanned before
- Search for a product by name when a scan can't identify it: suggestions come from your kitchen's past products, everyday foods, and Open Food Facts
- Scan a receipt: text is read on the phone, shorthand like "GV WHL MLK" is decoded, prices and totals are skipped, and items sold by weight or not recognized are flagged for you to fill in before adding

Receipt reading uses `expo-text-extractor`, which isn't part of Expo Go, so it needs the app's own build (`npx expo run:ios` or an EAS development build). In Expo Go and on web the receipt screen offers pasting the text instead. The reader lives in `src/lib/receiptReader.ts` and can be swapped for an AI reader later without touching the review screen.

Expiration reminders come next.

## Code layout

- `src/app/` holds the screens (Expo Router: every file is a screen)
- `src/components/` holds shared pieces like the sticker pictures and bottom bar
- `src/data/` holds the kitchen data model, sample food, and the session and kitchen state
- `src/lib/` holds the Supabase client and its generated database types
- `supabase/migrations/` holds the database tables and security rules (already applied to the live project)

## Checks

```bash
npx tsc --noEmit
```
