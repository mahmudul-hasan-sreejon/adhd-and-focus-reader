// Autopace moves the page down at a steady, user-set velocity using
// requestAnimationFrame so motion is smooth and frame-rate independent. It
// remembers position (the browser does this natively on scroll), pauses on
// user interaction, and stops at the bottom.
//
// The scroll target is resolved every frame via an optional getScroller hook:
// when reader mode is active the page scrolls inside the reader overlay (the
// document itself is overflow:hidden), so autopace must drive that element
// rather than the window. With no hook (or when it returns null) we drive the
// window as before.

export interface AutopaceController {
  start(): void;
  pause(): void;
  toggle(): void;
  reset(): void;
  setSpeed(pxPerSec: number): void;
  isRunning(): boolean;
  destroy(): void;
}

export function createAutopace(
  initialSpeed: number,
  getScroller?: () => HTMLElement | null,
): AutopaceController {
  let speed = initialSpeed; // px/sec
  let running = false;
  let rafId: number | null = null;
  let lastTs: number | null = null;
  let carry = 0; // sub-pixel accumulator for smoothness at low speeds

  // Resolve the live scroll target. null means scroll the window/document.
  const scroller = (): HTMLElement | null => getScroller?.() ?? null;

  const metrics = (el: HTMLElement | null) =>
    el
      ? { top: el.scrollTop, view: el.clientHeight, full: el.scrollHeight }
      : {
          top: window.scrollY,
          view: window.innerHeight,
          full: document.documentElement.scrollHeight,
        };

  const atBottom = (el: HTMLElement | null) => {
    const m = metrics(el);
    return m.top + m.view >= m.full - 2;
  };

  const scrollDown = (el: HTMLElement | null, px: number) => {
    if (el) el.scrollTop += px;
    else window.scrollBy(0, px);
  };

  const frame = (ts: number) => {
    if (!running) return;
    if (lastTs == null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    const el = scroller();
    carry += speed * dt;
    const px = Math.floor(carry);
    if (px >= 1) {
      carry -= px;
      scrollDown(el, px);
    }
    if (atBottom(el)) {
      pause();
      return;
    }
    rafId = requestAnimationFrame(frame);
  };

  // Any manual scroll-intent input pauses autopace so we never fight the user.
  // Wheel/key/touch events bubble to the window even when scrolling happens
  // inside the reader overlay, so window-level listeners cover both targets.
  const onUserInput = (e: Event) => {
    if (!running) return;
    if (e.type === 'wheel' || e.type === 'keydown' || e.type === 'touchstart') {
      pause();
    }
  };

  function start() {
    if (running || atBottom(scroller())) return;
    running = true;
    lastTs = null;
    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('keydown', onUserInput);
    window.addEventListener('touchstart', onUserInput, { passive: true });
    rafId = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
    carry = 0;
    window.removeEventListener('wheel', onUserInput);
    window.removeEventListener('keydown', onUserInput);
    window.removeEventListener('touchstart', onUserInput);
  }

  return {
    start,
    pause,
    toggle: () => (running ? pause() : start()),
    reset: () => {
      pause();
      const el = scroller();
      if (el) el.scrollTop = 0;
      else window.scrollTo({ top: 0, behavior: 'auto' });
    },
    setSpeed: (v) => (speed = v),
    isRunning: () => running,
    destroy: pause,
  };
}
