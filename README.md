# ADHD & Focus Reader

A reading & attention-support extension for Chromium browsers, built on
[WXT](https://wxt.dev) + React + TypeScript.

Repository: [mahmudul-hasan-sreejon/adhd-and-focus-reader](https://github.com/mahmudul-hasan-sreejon/adhd-and-focus-reader)

This repo is a **working foundation**, not the finished product. The core
reading engine runs; the cloud integrations and the full QA/release loop are
scoped out below as the next milestones.

## Status against the spec

| Milestone | Spec area | State |
|----------|-----------|-------|
| 1 | WXT project + architecture | ✅ done |
| 2 | Reader mode + DOM handling | ✅ Readability overlay, MutationObserver-safe |
| 3 | Typography (fonts, scale, line-height) | ✅ CSS engine + `@font-face` injection, fonts bundled¹ |
| 4 | Focus (bionic, chunking, autopace) | ✅ implemented, reversible |
| 5 | Comfort themes (sepia/dark/low-contrast) + word colour (6 selectable palettes) | ✅ done |
| 6 | Saved library + universal search | ◑ local IndexedDB store + search work; UI pending |
| 7 | Notion / Obsidian integrations | ◻ typed adapters stubbed (need OAuth/transport) |
| 8 | Performance optimisation | ◻ baseline only |
| 9 | Accessibility polish | ◑ popup is keyboard/AT-friendly; audit pending |
| 10 | Release + cross-browser QA | ◻ agentic — see handoff below |

¹ **Fonts are bundled.** The six OFL-licensed `.woff2` files ship in
`public/fonts/` — `OpenDyslexic-Regular.woff2`, `OpenDyslexic-Bold.woff2`,
`Lexend-Regular.woff2`, `Lexend-Bold.woff2`, `Atkinson-Regular.woff2`,
`Atkinson-Bold.woff2` (Regular/Bold only; filenames are enumerated in the
`FontFile` union in `lib/features/typography.ts`, which keeps `getURL` paths
type-safe against WXT's generated `PublicPath`). Lexend & Atkinson also bundle
into the popup via `@fontsource/*`.

**Icons** ship in `public/icon/` (`icon-16/32/48/96/128.png`, referenced from
`wxt.config.ts`). `public/icon/icon.svg` is the editable source — see
`public/icon/README.md` to regenerate the PNGs.

## Run it

```bash
npm install
npm run dev          # launches Chrome with the extension loaded + HMR
npm run dev:edge     # Edge
npm run build        # production build → .output/chrome-mv3/
npm run zip          # distributable zip
npm run compile      # type-check only
```

Open the popup, toggle features, watch them apply live to the current tab.
Shortcuts: `Alt+R` reader mode, `Alt+P` autopace.

## Architecture

```
entrypoints/
  background.ts      service worker: commands + context menu → active tab
  content/index.ts   orchestrator: reconciles page state with settings, reactive
  popup/             React control surface (writes settings, watcher does the rest)
lib/
  core/
    settings.ts      single typed settings object (sync storage, versioned)
    dom.ts           idempotent text-node walker, style injection, MutationObserver
  features/
    reader.ts        Mozilla Readability overlay (lossless toggle)
    typography.ts    fonts + themes + chunking + line-length (one CSS sheet)
    bionic.ts        reversible leading-fixation bolding
    wordcolor.ts     reversible per-word hue rotation (6 colour-theme palettes; wins over page theme via inline !important)
    autopace.ts      rAF smooth auto-scroll (window or reader overlay), pauses on user input
  integrations/
    index.ts         NoteTarget interface + working LocalLibrary + Notion/Obsidian stubs
```

**Design choices worth knowing:**
- *One settings object, one watcher.* Popup mutates `settings`; content script
  `watch()`es the same key and re-reconciles. No message ping-pong for state.
- *Every DOM transform is reversible and marked.* SPA churn re-fires the
  observer, but `data-afr-processed-*` guards make re-runs cheap no-ops.
- *Content script is framework-free* for startup speed; React lives only in the
  popup.

## Handoff to Claude Code (milestones 6–10)

The remaining work is iterative and needs your machine + accounts, so run it
locally in Claude Code. Suggested kickoff prompt:

> Continue this WXT extension. Implement: (6) a library/search page entrypoint
> reading from `lib/integrations` LocalLibrary; (7) Notion OAuth + Obsidian
> Local REST adapters fulfilling the `NoteTarget` interface; (8) profile and
> optimise the content-script passes on long pages; (9) run an a11y audit on
> the popup and reader overlay. Then deploy to my GitHub, and run Playwright
> across Chrome/Edge/Brave on a set of real article + SPA + docs pages, fixing
> regressions until reader mode, bionic, chunking, autopace, fonts and themes
> all pass. Commit per milestone.
