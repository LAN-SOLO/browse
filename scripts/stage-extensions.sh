#!/usr/bin/env bash
# Copies the preinstalled extensions (extensions/prebuilt/) into a built browse
# app bundle, at the bundle-relative external-extensions dir that patch 005
# points Chromium to. Run after build.sh; build.sh calls it automatically.
# Usage: stage-extensions.sh [path/to/browse.app]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="${1:-$ROOT/chromium/src/out/browse-mac/browse.app}"
SRC="$ROOT/extensions/prebuilt"
DEST="$APP/Contents/Resources/External Extensions"

[[ -d "$APP" ]] || { echo "stage-extensions: no app bundle at $APP" >&2; exit 1; }
[[ -d "$SRC" ]] || { echo "stage-extensions: no $SRC" >&2; exit 1; }

mkdir -p "$DEST"
# only the id-json manifests and their referenced crx files, not the README
find "$SRC" -maxdepth 1 \( -name '*.json' -o -name '*.crx' \) -exec cp {} "$DEST/" \;
shopt -s nullglob
manifests=("$DEST"/*.json)
echo "stage-extensions: staged ${#manifests[@]} extension(s) into the bundle"
