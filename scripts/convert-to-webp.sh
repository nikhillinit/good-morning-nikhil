#!/usr/bin/env bash
# Convert PNG stills in public/sets/ to WebP for web delivery.
# Requires: ffmpeg (available) or cwebp (preferred).
# Usage: bash scripts/convert-to-webp.sh

set -euo pipefail

SETS_DIR="$(dirname "$0")/../public/sets"

for f in "$SETS_DIR"/*.png; do
  [ -f "$f" ] || continue
  base="${f%.png}"
  if command -v cwebp &>/dev/null; then
    cwebp -q 85 "$f" -o "${base}.webp"
  else
    ffmpeg -y -i "$f" -quality 85 "${base}.webp" 2>/dev/null
  fi
  echo "Converted: $(basename "$f") -> $(basename "${base}.webp")"
done

echo ""
echo "Done. Update screens.ts bg paths from .png to .webp if desired,"
echo "or rely on ambient-map's extension-agnostic matching."
