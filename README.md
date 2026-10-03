## Local Server

```sh
npm run dev
```

## Scripts

- `scripts/pull-screenshots.sh [--generate]` — copy the app's generated WebP screenshots into `public/assets/img/screenshots/` (see the header comment for sizes).
- `scripts/make-og.sh` — re-render the social-sharing images `public/assets/img/og-{es,en}.jpg` from `scripts/og/og.html` (run after changing the hero headline).
