## Local Server

```sh
npm run dev
```

## Scripts

- `scripts/pull-screenshots.sh [--generate]` — copy the app's generated WebP screenshots into `public/assets/img/screenshots/<lang>/`, one set per locale (see the header comment for sizes).
- `node scripts/street-scene/build.mjs` — regenerate the hero's hand-drawn street of restaurants, `src/assets/street-scene.svg` (edit the venues and props in the script, not the SVG).
- `scripts/make-og.sh` — re-render the social-sharing images `public/assets/img/og-{es,en}.jpg` from `scripts/og/og.html` (run after changing the hero headline or the street scene).
