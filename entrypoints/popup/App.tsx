import { useEffect, useState } from 'react';
import {
  getSettings,
  patchSettings,
  watchSettings,
  type Settings,
  type ReadingFont,
  type Theme,
  type ChunkLevel,
  type WordColorTheme,
} from '@/lib/core/settings';

const FONTS: { value: ReadingFont; label: string }[] = [
  { value: 'system', label: 'Default' },
  { value: 'opendyslexic', label: 'OpenDyslexic' },
  { value: 'lexend', label: 'Lexend' },
  { value: 'atkinson', label: 'Atkinson' },
];
const THEMES: { value: Theme; label: string }[] = [
  { value: 'off', label: 'None' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Dark' },
  { value: 'low-contrast', label: 'Low' },
];
const CHUNKS: { value: ChunkLevel; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];
const WORD_COLOR_THEMES: { value: WordColorTheme; label: string }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'vivid', label: 'Vivid' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'forest', label: 'Forest' },
  { value: 'candy', label: 'Candy' },
];

function sendToActiveTab(type: string) {
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => tab?.id && browser.tabs.sendMessage(tab.id, { type }));
}

export default function App() {
  const [s, setS] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setS);
    return watchSettings(setS);
  }, []);

  if (!s) return <div className="afr-pop">Loading…</div>;

  const set = (patch: Partial<Settings>) => patchSettings(patch);

  return (
    <div className="afr-pop" role="group" aria-label="Focus Reader controls">
      <header className="afr-pop-head">
        <h1>Focus Reader</h1>
      </header>

      <Toggle
        label="Reader mode"
        checked={s.readerMode}
        onChange={(v) => set({ readerMode: v })}
        hint="Alt+R"
      />

      <Section title="Focus">
        <Toggle label="Bionic reading" checked={s.bionic} onChange={(v) => set({ bionic: v })} />
        {s.bionic && (
          <Range
            label="Fixation"
            min={0.3} max={0.7} step={0.05} value={s.bionicIntensity}
            onChange={(v) => set({ bionicIntensity: v })}
          />
        )}
        <SegMent label="Chunking" options={CHUNKS} value={s.chunk} onChange={(v) => set({ chunk: v })} />
        <div className="afr-row">
          <button onClick={() => sendToActiveTab('toggle-autopace')}>Autopace ▶︎/❚❚</button>
          <button onClick={() => sendToActiveTab('autopace-reset')}>Reset</button>
        </div>
        <Range
          label="Pace (px/s)" min={20} max={200} step={10} value={s.autopaceSpeed}
          onChange={(v) => set({ autopaceSpeed: v })}
        />
      </Section>

      <Section title="Typography">
        <SegMent label="Font" options={FONTS} value={s.font} onChange={(v) => set({ font: v })} />
        <Range label="Size" min={0.8} max={1.6} step={0.05} value={s.fontScale} onChange={(v) => set({ fontScale: v })} />
        <Range label="Line height" min={1.2} max={2.2} step={0.1} value={s.lineHeight} onChange={(v) => set({ lineHeight: v })} />
        <Toggle label="Word colour" checked={s.wordColor} onChange={(v) => set({ wordColor: v })} />
        {s.wordColor && (
          <SegMent
            label="Colour theme" options={WORD_COLOR_THEMES} value={s.wordColorTheme}
            onChange={(v) => set({ wordColorTheme: v })}
          />
        )}
      </Section>

      <Section title="Comfort">
        <SegMent label="Theme" options={THEMES} value={s.theme} onChange={(v) => set({ theme: v })} />
        <Toggle label="Reduce motion" checked={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="afr-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange, hint }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className="afr-toggle">
      <span>{label}{hint && <kbd>{hint}</kbd>}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Range({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <label className="afr-range">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

function SegMent<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="afr-seg" role="radiogroup" aria-label={label}>
      <span className="afr-seg-label">{label}</span>
      <div className="afr-seg-buttons">
        {options.map((o) => (
          <button key={o.value} role="radio" aria-checked={value === o.value}
            className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
