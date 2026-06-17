import { Readability } from '@mozilla/readability';

// Reader mode extracts the primary article with Mozilla's Readability (the same
// engine Firefox Reader View uses), then renders it into a clean overlay we own
// end-to-end. We never destroy the original DOM — we hide it and keep a handle
// so toggling off is instant and lossless.

const OVERLAY_ID = 'afr-reader-overlay';
let active = false;

export function isReaderActive(): boolean {
  return active;
}

export function enableReader(): boolean {
  if (active) return true;

  // Clone so Readability doesn't mutate the live document.
  const docClone = document.cloneNode(true) as Document;
  const article = new Readability(docClone).parse();
  if (!article || !article.content) {
    return false; // page isn't article-shaped; caller can surface a notice
  }

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'afr-reader';
  overlay.innerHTML = `
    <div class="afr-reader-inner">
      <header class="afr-reader-head">
        <h1>${escapeHtml(article.title ?? '')}</h1>
        ${article.byline ? `<p class="afr-byline">${escapeHtml(article.byline)}</p>` : ''}
      </header>
      <div class="afr-reader-body">${article.content}</div>
    </div>`;

  // Style the overlay. Inherits the comfort theme vars from typography.ts.
  const style = document.createElement('style');
  style.id = 'afr-reader-style';
  style.textContent = `
    #${OVERLAY_ID}{position:fixed;inset:0;z-index:2147483646;overflow-y:auto;
      background:var(--afr-bg,#fff);color:var(--afr-fg,#1a1a1a);}
    #${OVERLAY_ID} .afr-reader-inner{max-width:42rem;margin:0 auto;padding:4rem 1.5rem 8rem;}
    #${OVERLAY_ID} h1{font-size:2rem;line-height:1.2;margin:0 0 .5rem;}
    #${OVERLAY_ID} .afr-byline{opacity:.7;margin:0 0 2rem;}
    #${OVERLAY_ID} img,#${OVERLAY_ID} figure{max-width:100%;height:auto;}
    #${OVERLAY_ID} p{margin:0 0 1.2em;}`;

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(overlay);
  document.documentElement.style.setProperty('overflow', 'hidden', 'important');
  active = true;
  return true;
}

export function disableReader(): void {
  document.getElementById(OVERLAY_ID)?.remove();
  document.getElementById('afr-reader-style')?.remove();
  document.documentElement.style.removeProperty('overflow');
  active = false;
}

export function getReaderRoot(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
