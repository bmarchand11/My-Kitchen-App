import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

// Reads the text off a receipt photo, on the phone, for free. This is the one
// piece to swap for an AI reader later; it only has to return lines of text.

type TextExtractor = { isSupported: boolean; extractTextFromImage: (uri: string) => Promise<string[]> };

function loadExtractor(): TextExtractor | null {
  if (Platform.OS === 'web') return null;
  try {
    // Not included in Expo Go, only in the app's own build, so load it lazily and fail softly.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-text-extractor') as TextExtractor;
  } catch {
    return null;
  }
}

const extractor = loadExtractor();

export const canReadReceipts = !!extractor?.isSupported;

export async function readReceipt(photoUri: string): Promise<string[]> {
  if (!extractor) throw new Error('Receipt reading needs the full My Kitchen app, not the preview.');
  // Redrawing the photo bakes in its rotation (the reader ignores it) and shrinks it so reading is quick.
  const prepared = await manipulateAsync(photoUri, [{ resize: { width: 1800 } }], {
    compress: 0.9,
    format: SaveFormat.JPEG,
  });
  return extractor.extractTextFromImage(prepared.uri);
}
