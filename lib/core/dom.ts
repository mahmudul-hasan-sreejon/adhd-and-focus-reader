// ---------------------------------------------------------------------------
// DOM utilities shared by every feature.
// ---------------------------------------------------------------------------
// The golden rule for a content script that mutates arbitrary sites: never
// touch the same node twice, and never break the page's own behaviour. Every
// transform here is reversible and marked so re-runs (from MutationObserver
// churn on SPA sites) are cheap no-ops.

export const PROCESSED_ATTR = 'data-afr-processed';
export const ORIGINAL_HTML_ATTR = 'data-afr-original';

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE',
  'KBD', 'SAMP', 'SVG', 'MATH', 'CANVAS', 'IFRAME',
]);

const SKIP_EDITABLE = (el: Element) =>
  (el as HTMLElement).isContentEditable ||
  el.getAttribute('role') === 'textbox';

/**
 * Walk visible text nodes under `root`, skipping anything interactive,
 * pre-formatted, or already processed by a given feature key.
 */
export function walkTextNodes(
  root: Node,
  featureKey: string,
  visit: (node: Text) => void,
): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue;
      if (!text || !text.trim()) return NodeFilter.FILTER_REJECT;

      let el: Element | null = node.parentElement;
      while (el) {
        if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        if (SKIP_EDITABLE(el)) return NodeFilter.FILTER_REJECT;
        if (el.hasAttribute(`${PROCESSED_ATTR}-${featureKey}`)) {
          return NodeFilter.FILTER_REJECT;
        }
        el = el.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const batch: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    batch.push(current as Text);
    current = walker.nextNode();
  }
  // Collect first, then mutate — mutating during the walk invalidates it.
  for (const node of batch) visit(node);
}

export function markProcessed(el: Element, featureKey: string): void {
  el.setAttribute(`${PROCESSED_ATTR}-${featureKey}`, '1');
}

/** Inject a <style> tag once, keyed so we can update or remove it cleanly. */
export function setStyle(id: string, css: string): void {
  let tag = document.getElementById(id) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = id;
    document.documentElement.appendChild(tag);
  }
  tag.textContent = css;
}

export function removeStyle(id: string): void {
  document.getElementById(id)?.remove();
}

/** Debounced MutationObserver — survives SPA route changes and lazy content. */
export function observeMutations(cb: () => void, delayMs = 250): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(cb, delayMs);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    if (timer) clearTimeout(timer);
  };
}
