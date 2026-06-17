// Autopace moves the page down at a steady, user-set velocity using
// requestAnimationFrame so motion is smooth and frame-rate independent. It
// remembers position (the browser does this natively on scroll), pauses on
// user interaction, and stops at the bottom.

export interface AutopaceController {
  start(): void;
  pause(): void;
  toggle(): void;
  reset(): void;
  setSpeed(pxPerSec: number): void;
  isRunning(): boolean;
  destroy(): void;
}

export function createAutopace(initialSpeed: number): AutopaceController {
  let speed = initialSpeed; // px/sec
  let running = false;
  let rafId: number | null = null;
  let lastTs: number | null = null;
  let carry = 0; // sub-pixel accumulator for smoothness at low speeds

  const atBottom = () =>
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;

  const frame = (ts: number) => {
    if (!running) return;
    if (lastTs == null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    carry += speed * dt;
    const px = Math.floor(carry);
    if (px >= 1) {
      carry -= px;
      window.scrollBy(0, px);
    }
    if (atBottom()) {
      pause();
      return;
    }
    rafId = requestAnimationFrame(frame);
  };

  // Any manual scroll-intent input pauses autopace so we never fight the user.
  const onUserInput = (e: Event) => {
    if (!running) return;
    if (e.type === 'wheel' || e.type === 'keydown' || e.type === 'touchstart') {
      pause();
    }
  };

  function start() {
    if (running || atBottom()) return;
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
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    setSpeed: (v) => (speed = v),
    isRunning: () => running,
    destroy: pause,
  };
}
