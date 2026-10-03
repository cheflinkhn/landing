#!/usr/bin/env bash
#
# Pull the generated app screenshots from the cheflink repo into this landing
# project, keeping their original filenames (01-kds-board.webp … etc). The site
# references them by these same names, so this is a straight copy — no renaming.
#
# Usage:
#   scripts/pull-screenshots.sh             # copy already-generated screenshots
#   scripts/pull-screenshots.sh --generate  # regenerate them in cheflink first
#
# Locations (override with env vars):
#   CHEFLINK_DIR   path to the cheflink app repo   (default: ../cheflink)
#
# The screenshots are generated output (not committed in cheflink); this script
# copies the local files into public/assets/img/screenshots/ here, where they
# ARE committed as landing assets. The generator writes WebP (Chrome encodes it
# natively); a leftover .png twin of a pulled file is removed so the folder only
# holds what the site serves.
#
# Capture sizes (see cheflink/scripts/screenshots/shoot.mjs): backoffice views
# 1280×800 at 2× (2560×1600; menu/inventory are full-page), the tablet board
# 1024×768 at 2× (2048×1536), consumer views 390 wide at 3× (1170 px wide).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LANDING_ROOT="$(cd "$HERE/.." && pwd)"
CHEFLINK_DIR="${CHEFLINK_DIR:-$(cd "$LANDING_ROOT/../cheflink" 2>/dev/null && pwd || true)}"
SRC="$CHEFLINK_DIR/docs/screenshots"
DEST="$LANDING_ROOT/public/assets/img/screenshots"

# The screenshots the site references, by their original generated names.
FILES=(
  01-kds-board.webp
  02-kds-floor.webp
  03-sales-kpis.webp
  04-backoffice-menu.webp
  05-backoffice-inventory.webp
  06-consumer-menu.webp
  07-consumer-add-item.webp
  08-consumer-tab.webp
  09-consumer-paid-tab.webp
  10-table-reservation.webp
  11-kds-board-tablet.webp
  12-consumer-delivery.webp
)

if [ "${1:-}" = "--generate" ]; then
  echo "==> Regenerating screenshots in $CHEFLINK_DIR"
  "$CHEFLINK_DIR/scripts/screenshots/generate.sh"
fi

if [ ! -d "$SRC" ]; then
  echo "Source screenshots not found: $SRC" >&2
  echo "Set CHEFLINK_DIR to the cheflink app repo, or run with --generate." >&2
  exit 1
fi
mkdir -p "$DEST"

copied=0
missing=0
pruned=0
for f in "${FILES[@]}"; do
  if [ -f "$SRC/$f" ]; then
    cp "$SRC/$f" "$DEST/$f"
    echo "  ✓ $f"
    copied=$((copied + 1))
    # Drop the PNG the generator used to produce for this view.
    png="$DEST/${f%.webp}.png"
    if [ -f "$png" ]; then
      rm "$png"
      pruned=$((pruned + 1))
    fi
  else
    echo "  ! missing source: $SRC/$f" >&2
    missing=$((missing + 1))
  fi
done

echo
echo "Copied $copied screenshot(s) into ${DEST#"$LANDING_ROOT"/}"
[ "$pruned" -gt 0 ] && echo "Removed $pruned stale .png file(s)"
[ "$missing" -gt 0 ] && echo "WARNING: $missing source file(s) missing — run with --generate?" >&2
exit 0
