import { defineContentScript } from 'wxt/utils/define-content-script';
import { getSettings, watchSettings, type Settings } from '@/lib/core/settings';
import { observeMutations } from '@/lib/core/dom';
import { applyBionic, removeBionic } from '@/lib/features/bionic';
import { applyWordColor, removeWordColor } from '@/lib/features/wordcolor';
import { applyTypography, removeTypography } from '@/lib/features/typography';
import { createAutopace } from '@/lib/features/autopace';
import {
  enableReader,
  disableReader,
  isReaderActive,
  getReaderRoot,
} from '@/lib/features/reader';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let current: Settings;
    // When reader mode is active the page scrolls inside the overlay, not the
    // window, so autopace drives that element instead.
    const autopace = createAutopace(60, () => getReaderRoot());
    let stopObserving: (() => void) | null = null;

    // Re-run the DOM-level passes (bionic / wordcolor) over a given root.
    const runDomPasses = (s: Settings, root: ParentNode) => {
      removeBionic(root);
      removeWordColor(root);
      if (s.bionic) applyBionic(root, s.bionicIntensity);
      if (s.wordColor) applyWordColor(root, s.wordColorTheme);
    };

    const reconcile = (s: Settings) => {
      current = s;
      autopace.setSpeed(s.autopaceSpeed);

      // Reader overlay.
      if (s.readerMode && !isReaderActive()) enableReader();
      if (!s.readerMode && isReaderActive()) disableReader();

      // CSS-driven features (font, theme, chunk, line-length, motion).
      applyTypography(s);

      // DOM passes target the reader overlay if active, else the whole body.
      const root = (getReaderRoot() as ParentNode | null) ?? document.body;
      runDomPasses(s, root);

      // Watch for new content (infinite scroll, SPA nav) and re-apply.
      stopObserving?.();
      if (s.bionic || s.wordColor) {
        stopObserving = observeMutations(() => {
          const r = (getReaderRoot() as ParentNode | null) ?? document.body;
          if (current.bionic) applyBionic(r, current.bionicIntensity);
          if (current.wordColor) applyWordColor(r, current.wordColorTheme);
        });
      }
    };

    // Command messages from background (keyboard shortcuts + popup buttons).
    browser.runtime.onMessage.addListener((msg: { type: string }) => {
      switch (msg.type) {
        case 'toggle-reader':
          reconcile({ ...current, readerMode: !current.readerMode });
          break;
        case 'toggle-autopace':
          autopace.toggle();
          break;
        case 'autopace-reset':
          autopace.reset();
          break;
      }
    });

    // Boot: load settings, apply, then react to any future change.
    getSettings().then((s) => {
      reconcile(s);
      watchSettings(reconcile);
    });

    // Clean up on navigation away (bfcache friendliness).
    window.addEventListener('pagehide', () => {
      autopace.destroy();
      stopObserving?.();
    });
  },
});
