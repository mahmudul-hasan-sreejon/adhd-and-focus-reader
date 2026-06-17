import { walkTextNodes, markProcessed } from '@/lib/core/dom';

// Bionic reading bolds the leading "fixation" of each word so the eye snaps to
// word starts. We replace each qualifying text node with a fragment of
// <b class="afr-fix"> + remainder, and tag the parent so we never re-process.
// Removal just unwraps every .afr-fix back to plain text.

const FEATURE = 'bionic';
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*/gu; // unicode-aware word matcher

function fixationLength(word: string, intensity: number): number {
  // Short words get a lighter touch; longer words scale with intensity.
  const len = word.length;
  if (len <= 1) return len;
  if (len <= 3) return 1;
  return Math.max(1, Math.round(len * intensity));
}

export function applyBionic(root: ParentNode, intensity: number): void {
  walkTextNodes(root, FEATURE, (textNode) => {
    const text = textNode.nodeValue ?? '';
    if (!WORD_RE.test(text)) return;
    WORD_RE.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = WORD_RE.exec(text)) !== null) {
      const [word] = match;
      const start = match.index;
      if (start > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }
      const cut = fixationLength(word, intensity);
      const b = document.createElement('b');
      b.className = 'afr-fix';
      b.textContent = word.slice(0, cut);
      frag.appendChild(b);
      frag.appendChild(document.createTextNode(word.slice(cut)));
      lastIndex = start + word.length;
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

export function removeBionic(root: ParentNode): void {
  root.querySelectorAll('b.afr-fix').forEach((b) => {
    const parent = b.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(b.textContent ?? ''), b);
    parent.normalize(); // merge adjacent text nodes back together
    (parent as Element).removeAttribute?.('data-afr-processed-bionic');
  });
}
