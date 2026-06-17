import { walkTextNodes, markProcessed } from '@/lib/core/dom';

// Per-word colour can't be done in pure CSS, so we wrap words in <span> with a
// rotating hue. Kept low-saturation and contrast-aware via the --afr-wc alpha
// set in typography.ts. Reversible the same way bionic is.

const FEATURE = 'wordcolor';
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*/gu;
const HUES = [210, 160, 28, 280, 340]; // calm, well-separated hues

export function applyWordColor(root: ParentNode): void {
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
      const hue = HUES[i++ % HUES.length];
      span.style.color = `hsla(${hue}, 45%, 35%, calc(0.6 + var(--afr-wc, 0.4)))`;
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
