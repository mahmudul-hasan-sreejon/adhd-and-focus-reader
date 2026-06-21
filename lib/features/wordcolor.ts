import { walkTextNodes, markProcessed } from '@/lib/core/dom';

// Per-word colour can't be done in pure CSS, so we wrap words in <span> with a
// rotating hue. Kept low-saturation and contrast-aware via the --afr-wc alpha
// set in typography.ts. Reversible the same way bionic is.

import type { WordColorTheme } from '@/lib/core/settings';

const FEATURE = 'wordcolor';
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*/gu;

// Each theme is a rotating set of well-separated hues plus the saturation and
// lightness that give it its character. Alpha stays driven by --afr-wc so the
// intensity slider keeps working across every theme.
interface Palette {
  hues: number[];
  sat: number;
  light: number;
}

const CALM: Palette = { hues: [210, 160, 28, 280, 340], sat: 45, light: 35 };

const PALETTES: Record<WordColorTheme, Palette> = {
  calm: CALM,
  vivid: { hues: [0, 35, 130, 210, 280], sat: 72, light: 42 },
  warm: { hues: [0, 18, 35, 52, 340], sat: 55, light: 38 },
  cool: { hues: [190, 210, 232, 260, 160], sat: 50, light: 40 },
  forest: { hues: [25, 48, 95, 150, 200], sat: 38, light: 32 },
  candy: { hues: [330, 280, 200, 50, 160], sat: 60, light: 50 },
};

export function applyWordColor(root: ParentNode, theme: WordColorTheme = 'calm'): void {
  const palette = PALETTES[theme] ?? CALM;
  const hues = palette.hues;
  let i = 0;
  walkTextNodes(root, FEATURE, (textNode) => {
    const text = textNode.nodeValue ?? '';
    if (!WORD_RE.test(text)) return;
    WORD_RE.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WORD_RE.exec(text)) !== null) {
      const start = match.index;
      if (start > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }
      const span = document.createElement('span');
      span.className = 'afr-wc';
      const hue = hues[i++ % hues.length];
      // Use !important so word colour wins over an active page theme, whose
      // `span { color: ... !important }` rule would otherwise mask it.
      span.style.setProperty(
        'color',
        `hsla(${hue}, ${palette.sat}%, ${palette.light}%, calc(0.6 + var(--afr-wc, 0.4)))`,
        'important',
      );
      span.textContent = match[0];
      frag.appendChild(span);
      lastIndex = start + match[0].length;
    }
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    const parent = textNode.parentElement;
    if (parent) {
      parent.replaceChild(frag, textNode);
      markProcessed(parent, FEATURE);
    }
  });
}

export function removeWordColor(root: ParentNode): void {
  root.querySelectorAll('span.afr-wc').forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(span.textContent ?? ''), span);
    parent.normalize();
    (parent as Element).removeAttribute?.('data-afr-processed-wordcolor');
  });
}
