#!/usr/bin/env bash
# Packs the handbook extension (extensions/handbook/) into a CRX in
# extensions/prebuilt/, plus the <id>.json manifest that patch 005's
# external-extensions mechanism expects. stage-extensions.sh then bundles it
# into the app like uBlock.
#
# The signing key lives OUTSIDE the repo (the extension id is derived from
# it, so it must stay stable): ~/.browse/handbook.pem — created on first run.
#
# Usage: pack-handbook.sh [path/to/chromium-binary]
#        Default binary: the built browse.app; any Chromium works.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/extensions/handbook"
OUT="$ROOT/extensions/prebuilt"
KEY="$HOME/.browse/handbook.pem"
BIN="${1:-$ROOT/chromium/src/out/browse-mac/browse.app/Contents/MacOS/browse}"

[[ -x "$BIN" ]] || { echo "pack-handbook: no chromium binary at $BIN (pass one as \$1)" >&2; exit 1; }

mkdir -p "$(dirname "$KEY")" "$OUT"
if [[ ! -f "$KEY" ]]; then
  echo "pack-handbook: generating new signing key at $KEY"
  openssl genrsa -out "$KEY" 2048 2>/dev/null
fi

# Chromium writes handbook.crx next to the source dir.
"$BIN" --pack-extension="$SRC" --pack-extension-key="$KEY" --no-message-box >/dev/null

# Extension id = first 16 bytes of SHA256 over the DER public key, mapped a–p.
ID="$(openssl rsa -in "$KEY" -pubout -outform DER 2>/dev/null \
  | shasum -a 256 | head -c 32 | tr '0-9a-f' 'a-p')"
VERSION="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["version"])' "$SRC/manifest.json")"

mv "$ROOT/extensions/handbook.crx" "$OUT/handbook.crx"
printf '{\n  "external_crx": "handbook.crx",\n  "external_version": "%s"\n}\n' "$VERSION" > "$OUT/$ID.json"

echo "pack-handbook: packed handbook v$VERSION as $ID"
