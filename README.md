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

The food is sample data held in memory, so changes reset when the app restarts. Accounts, household sharing, and adding food come next.

## Code layout

- `src/app/` holds the screens (Expo Router: every file is a screen)
- `src/components/` holds shared pieces like the sticker pictures and bottom bar
- `src/data/` holds the kitchen data model and sample food

## Checks

```bash
npx tsc --noEmit
```
