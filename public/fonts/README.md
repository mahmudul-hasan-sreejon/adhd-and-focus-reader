# Reading fonts

The content script renders the selected reading font on any page via `@font-face`
declarations in `lib/features/typography.ts`. These filenames are referenced
verbatim — keep them exact.

Bundled here (Regular = weight 400, Bold = weight 700; OFL-licensed):

- `OpenDyslexic-Regular.woff2` / `OpenDyslexic-Bold.woff2`   (<https://opendyslexic.org>)
- `Lexend-Regular.woff2`       / `Lexend-Bold.woff2`          (Google Fonts / @fontsource/lexend)
- `Atkinson-Regular.woff2`     / `Atkinson-Bold.woff2`        (Braille Institute / @fontsource/atkinson-hyperlegible)

Only Regular and Bold are loaded — typography uses CSS for any heavier emphasis,
so other weights/italics are intentionally not shipped to keep the bundle small.

To swap a font, replace the file under the same name (or update the `@font-face`
`src` in `lib/features/typography.ts` to match a new filename).
