#!/usr/bin/env bash
#
# Encode the hero loops rendered in the cheflink-video repo (Remotion), one per
# site language, into the web versions the landing serves, and copy each
# render's poster alongside.
#
# Usage:
#   scripts/encode-hero-video.sh
#
# Locations (override with env vars):
#   VIDEO_DIR   path to the cheflink-video repo   (default: ../cheflink-video)
#   FFMPEG      ffmpeg binary (default: ffmpeg on PATH, else the one Remotion
#               bundles in cheflink-video's node_modules)
#
# The Remotion render is encoded for social uploads (~4 Mbps, ~13 MB), far too
# heavy above the fold. UI footage is flat colour and text, so x264 with the
# "animation" tune keeps it sharp at a fraction of that: one muted H.264 file
# per language, 1280 wide (phones don't show the hero video), with the moov
# atom up front (faststart) so playback starts before the download ends. The poster
# is the render's own first frame and is copied as is; HeroVideo.astro paints it
# as the LCP image and only attaches a video after the page has loaded.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LANDING_ROOT="$(cd "$HERE/.." && pwd)"
VIDEO_DIR="${VIDEO_DIR:-$(cd "$LANDING_ROOT/../cheflink-video" 2>/dev/null && pwd || true)}"
SRC="$VIDEO_DIR/out"
DEST="$LANDING_ROOT/public/assets/video"
LANGS=(es en)

for lang in "${LANGS[@]}"; do
  if [ ! -f "$SRC/landing-loop-$lang.mp4" ] || [ ! -f "$SRC/landing-loop-$lang-poster.webp" ]; then
    echo "Render not found: $SRC/landing-loop-$lang.mp4 (and its -poster.webp)" >&2
    echo "Render the landing loops in cheflink-video, or set VIDEO_DIR." >&2
    exit 1
  fi
done

if [ -z "${FFMPEG:-}" ]; then
  if command -v ffmpeg >/dev/null 2>&1; then
    FFMPEG=ffmpeg
  else
    bundled="$VIDEO_DIR/node_modules/@remotion/compositor-linux-x64-gnu"
    if [ -x "$bundled/ffmpeg" ]; then
      FFMPEG="$bundled/ffmpeg"
      export LD_LIBRARY_PATH="$bundled${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
    else
      echo "No ffmpeg found. Install it, or run npm install in cheflink-video." >&2
      exit 1
    fi
  fi
fi

mkdir -p "$DEST"

encode() { # input width crf output
  "$FFMPEG" -v error -y -i "$1" -an \
    -vf "scale=$2:-2:flags=lanczos" \
    -c:v libx264 -preset slow -tune animation -crf "$3" \
    -profile:v high -pix_fmt yuv420p -g 300 -movflags +faststart \
    "$DEST/$4"
  echo "  ✓ $4 ($(( $(stat -c %s "$DEST/$4") / 1024 )) KB)"
}

for lang in "${LANGS[@]}"; do
  echo "==> Encoding landing-loop-$lang.mp4"
  encode "$SRC/landing-loop-$lang.mp4" 1280 24 "hero-loop-$lang-1280.mp4"
  cp "$SRC/landing-loop-$lang-poster.webp" "$DEST/hero-loop-$lang-poster.webp"
  echo "  ✓ hero-loop-$lang-poster.webp ($(( $(stat -c %s "$DEST/hero-loop-$lang-poster.webp") / 1024 )) KB)"
done
