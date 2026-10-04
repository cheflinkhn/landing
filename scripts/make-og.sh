#!/usr/bin/env bash
#
# Render the social-sharing images (og:image / twitter:image), one per language,
# from scripts/og/og.html: the hero's headline over the street scene, 1200×630.
# Run after changing the hero headline or regenerating src/assets/street-scene.svg.
#
#   scripts/make-og.sh
#
# Writes public/assets/img/og-es.jpg and og-en.jpg (committed assets).
# Requirements: Chrome (CHROME_PATH, default google-chrome on PATH), python3
# with Pillow for the JPEG conversion, and network access for Google Fonts.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
CHROME="${CHROME_PATH:-google-chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

render() {
  local lang="$1" eyebrow="$2" headline="$3"
  local html="$HERE/og/.og-$lang.html"
  python3 - "$HERE/og/og.html" "$html" "$lang" "$eyebrow" "$headline" <<'EOF'
import os, sys
src, dst, lang, eyebrow, headline = sys.argv[1:6]
scene = open(os.path.join(os.path.dirname(src), "../../src/assets/street-scene.svg"), encoding="utf-8").read()
s = open(src, encoding="utf-8").read().replace("{{lang}}", lang).replace("{{eyebrow}}", eyebrow).replace("{{headline}}", headline).replace("{{scene}}", scene)
open(dst, "w", encoding="utf-8").write(s)
EOF
  # The virtual-time budget lets the web fonts load before the capture.
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1200,630 --virtual-time-budget=6000 \
    --screenshot="$TMP/og-$lang.png" "file://$html" >/dev/null 2>&1
  rm -f "$html"
  python3 - "$TMP/og-$lang.png" "$ROOT/public/assets/img/og-$lang.jpg" <<'EOF'
import sys
from PIL import Image
src, dst = sys.argv[1:3]
Image.open(src).convert("RGB").save(dst, "JPEG", quality=88, optimize=True, progressive=True)
EOF
  echo "  ✓ public/assets/img/og-$lang.jpg"
}

render es "El sistema operativo para restaurantes" "Todo tu restaurante, <em>en un solo sistema.</em>"
render en "The restaurant operating system" "Your whole restaurant, <em>in one system.</em>"
