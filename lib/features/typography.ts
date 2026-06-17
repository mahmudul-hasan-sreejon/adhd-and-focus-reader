import { setStyle, removeStyle } from '@/lib/core/dom';
import type { Settings, ReadingFont, Theme, ChunkLevel } from '@/lib/core/settings';

// Typography, themes, chunking and word-colour are all expressible as CSS, so
// they share one injected stylesheet (#afr-style). This keeps them instant to
// toggle and impossible to "half-apply" — we just rewrite the whole sheet.

const STYLE_ID = 'afr-style';

// @font-face declarations pointing at web_accessible font files, so the chosen
// reading font renders on any page (drop the files into public/fonts/).
function fontFaces(): string {
  const url = (p: string) => browser.runtime.getURL(`/fonts/${p}` as `/${string}`);
  return `
    @font-face{font-family:"OpenDyslexic";src:url("${url('OpenDyslexic-Regular.woff2')}") format("woff2");font-weight:400;font-display:swap;}
    @font-face{font-family:"OpenDyslexic";src:url("${url('OpenDyslexic-Bold.woff2')}") format("woff2");font-weight:700;font-display:swap;}
    @font-face{font-family:"Lexend";src:url("${url('Lexend-Regular.woff2')}") format("woff2");font-weight:400;font-display:swap;}
    @font-face{font-family:"Lexend";src:url("${url('Lexend-Bold.woff2')}") format("woff2");font-weight:700;font-display:swap;}
    @font-face{font-family:"Atkinson Hyperlegible";src:url("${url('Atkinson-Regular.woff2')}") format("woff2");font-weight:400;font-display:swap;}
    @font-face{font-family:"Atkinson Hyperlegible";src:url("${url('Atkinson-Bold.woff2')}") format("woff2");font-weight:700;font-display:swap;}
  `;
}

const FONT_STACK: Record<ReadingFont, string> = {
  system: '', // unset → inherit page font
  opendyslexic: '"OpenDyslexic", sans-serif',
  lexend: '"Lexend", sans-serif',
  atkinson: '"Atkinson Hyperlegible", sans-serif',
};

const CHUNK_SPACING: Record<ChunkLevel, string> = {
  off: '',
  light: '0.9em',
  medium: '1.4em',
  heavy: '2em',
};

function themeVars(theme: Theme): string {
  switch (theme) {
    case 'sepia':
      return `--afr-bg:#f4ecd8;--afr-fg:#5b4636;--afr-link:#7a5a2f;`;
    case 'dark':
      return `--afr-bg:#1a1a1e;--afr-fg:#d6d6d6;--afr-link:#7aa2f7;`;
    case 'low-contrast':
      return `--afr-bg:#e9e9ec;--afr-fg:#55555c;--afr-link:#5566aa;`;
    case 'off':
    default:
      return '';
  }
}

export function applyTypography(s: Settings): void {
  const parts: string[] = [];

  // Declare @font-face only when a bundled font is selected (avoids loading
  // font files on pages that don't need them).
  if (s.font !== 'system') parts.push(fontFaces());

  // Theme is scoped to <html> so it cascades but stays overridable per-feature.
  const tv = themeVars(s.theme);
  if (tv) {
    parts.push(`html{${tv}}`);
    parts.push(
      `html, body { background-color: var(--afr-bg) !important; color: var(--afr-fg) !important; }`,
      `p, li, span, h1, h2, h3, h4, h5, h6, article, section { color: var(--afr-fg) !important; }`,
      `a { color: var(--afr-link) !important; }`,
    );
  }

  // Reading font + scale + line-height applied to flowing text only, so we
  // don't wreck nav bars and buttons.
  const READ_SEL = 'p, li, article, .afr-reader, .afr-reader *';
  const rules: string[] = [];
  if (s.font !== 'system' && FONT_STACK[s.font]) {
    rules.push(`font-family: ${FONT_STACK[s.font]} !important;`);
  }
  if (s.fontScale !== 1) rules.push(`font-size: ${s.fontScale}em !important;`);
  rules.push(`line-height: ${s.lineHeight} !important;`);
  if (rules.length) parts.push(`${READ_SEL} { ${rules.join(' ')} }`);

  // Bionic fixation styling.
  parts.push(`b.afr-fix { font-weight: 700; }`);

  // Chunking: extra vertical rhythm between paragraphs + a measure cap so lines
  // don't run edge-to-edge.
  if (s.chunk !== 'off') {
    parts.push(
      `p { margin-bottom: ${CHUNK_SPACING[s.chunk]} !important; max-width: ${s.maxLineChars}ch !important; }`,
    );
  }

  // Word colourisation: alternate a subtle hue across words via nth-of-type is
  // not possible per-word in pure CSS, so the real colouring is done in the DOM
  // pass (wordcolor.ts); here we just define the palette variables.
  if (s.wordColor) {
    const a = (0.15 + s.wordColorIntensity * 0.35).toFixed(2);
    parts.push(`:root{--afr-wc:${a};}`);
  }

  // Reduced motion respect.
  if (s.reduceMotion) {
    parts.push(`* { scroll-behavior: auto !important; }`);
  }

  if (parts.length === 0) {
    removeStyle(STYLE_ID);
  } else {
    setStyle(STYLE_ID, parts.join('\n'));
  }
}

export function removeTypography(): void {
  removeStyle(STYLE_ID);
}
