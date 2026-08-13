#!/usr/bin/env bash
# Applies patches/ in the order listed in patches/series onto chromium/src
# using git apply --3way. Safe to re-run: already-applied patches are skipped.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/chromium/src"
SERIES="$ROOT/patches/series"

[[ -d "$SRC" ]] || { echo "apply: no checkout at $SRC — run fetch-chromium.sh first" >&2; exit 1; }

applied=0
while IFS= read -r name; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  patch="$ROOT/patches/$name"
  [[ -f "$patch" ]] || { echo "apply: missing $patch (listed in series)" >&2; exit 1; }
  if git -C "$SRC" apply --check --reverse "$patch" >/dev/null 2>&1; then
    echo "apply: $name already applied — skipping"
    continue
  fi
  echo "apply: $name"
  git -C "$SRC" apply --3way "$patch"
  applied=$((applied + 1))
done < "$SERIES"

echo "apply: done ($applied newly applied)"
