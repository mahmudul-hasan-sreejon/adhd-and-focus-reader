import { storage } from 'wxt/utils/storage';

// ---------------------------------------------------------------------------
// Settings contract
// ---------------------------------------------------------------------------
// One source of truth. The popup mutates these; the content script watches the
// same storage item and re-renders the active page. Keeping it as a single
// object means one storage round-trip and one watcher per page.

export type ReadingFont =
  | 'system'
  | 'opendyslexic'
  | 'lexend'
  | 'atkinson';

export type Theme = 'off' | 'sepia' | 'dark' | 'low-contrast';

export type ChunkLevel = 'off' | 'light' | 'medium' | 'heavy';

export type WordColorTheme =
  | 'calm'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'forest'
  | 'candy';

export interface Settings {
  readerMode: boolean;

  // Typography
  font: ReadingFont;
  fontScale: number; // 1 = 100%
  lineHeight: number; // unitless multiplier

  // Focus assistance
  bionic: boolean;
  bionicIntensity: number; // 0.3–0.7, fraction of each word to bold
  chunk: ChunkLevel;
  maxLineChars: number; // measure-based line length cap (ch units)

  // Autopace
  autopaceSpeed: number; // px/sec scroll velocity

  // Comfort
  theme: Theme;
  wordColor: boolean;
  wordColorIntensity: number; // 0–1
  wordColorTheme: WordColorTheme;

  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  readerMode: false,
  font: 'system',
  fontScale: 1,
  lineHeight: 1.6,
  bionic: false,
  bionicIntensity: 0.4,
  chunk: 'off',
  maxLineChars: 70,
  autopaceSpeed: 60,
  theme: 'off',
  wordColor: false,
  wordColorIntensity: 0.5,
  wordColorTheme: 'calm',
  reduceMotion: false,
};

// Versioned so we can migrate the shape later without nuking user prefs.
export const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
  version: 1,
});

export async function getSettings(): Promise<Settings> {
  // Merge so newly-added keys always have a value even on old stored objects.
  const stored = await settingsItem.getValue();
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await settingsItem.setValue(next);
  return next;
}

export function watchSettings(cb: (s: Settings) => void): () => void {
  return settingsItem.watch((value) => cb({ ...DEFAULT_SETTINGS, ...value }));
}
