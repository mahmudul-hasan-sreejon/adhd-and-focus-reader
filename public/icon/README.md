Extension icons.

`icon.svg` is the editable source. The PNGs WXT ships
(`icon-16/32/48/96/128.png`) are rendered from it and referenced in
`wxt.config.ts` (`manifest.icons` + `action.default_icon`).

Regenerate the PNGs after editing `icon.svg` (requires ImageMagick):

```bash
cd public/icon
for s in 16 32 48 96 128; do
  magick -background none -density 384 icon.svg -resize ${s}x${s} -depth 8 -strip icon-${s}.png
done
```

Design: a calm indigo→teal tile of dimmed reading lines with one highlighted
focus line whose bold leading half nods to the bionic-reading feature.
