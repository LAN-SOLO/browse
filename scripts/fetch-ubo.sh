#!/usr/bin/env bash
# Downloads the pinned uBlock Origin builds (extensions/ublock.lock) into
# .cache/ and verifies checksums. Idempotent.
#   full: .cache/ublock/<ver>/uBlock0.chromium  (MV2 — for patched builds)
#   lite: .cache/ubol/<ver>/                    (MV3 — dev shell interim)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=/dev/null
source "$ROOT/extensions/ublock.lock"

fetch_zip() { # url sha dest_zip
  curl -fsSL -o "$3" "$1"
  echo "$2  $3" | shasum -a 256 -c - >/dev/null
}

# full uBlock Origin (archived for the patched build)
DEST="$ROOT/.cache/ublock/$UBO_VERSION"
if [[ ! -d "$DEST/uBlock0.chromium" ]]; then
  mkdir -p "$DEST"
  echo "ubo: downloading full uBlock Origin $UBO_VERSION"
  fetch_zip "$UBO_URL" "$UBO_SHA256" "$DEST/ublock.chromium.zip"
  unzip -qo "$DEST/ublock.chromium.zip" -d "$DEST"
  echo "ubo: full → $DEST/uBlock0.chromium"
else
  echo "ubo: full $UBO_VERSION present"
fi

# uBlock Origin Lite (dev shell)
LDEST="$ROOT/.cache/ubol/$UBOL_VERSION"
if [[ ! -f "$LDEST/manifest.json" ]]; then
  mkdir -p "$LDEST"
  echo "ubo: downloading uBlock Origin Lite $UBOL_VERSION"
  fetch_zip "$UBOL_URL" "$UBOL_SHA256" "$LDEST/ubol.chromium.zip"
  unzip -qo "$LDEST/ubol.chromium.zip" -d "$LDEST"   # archive is flat
  echo "ubo: lite → $LDEST"
else
  echo "ubo: lite $UBOL_VERSION present"
fi
