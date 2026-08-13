#!/usr/bin/env bash
# Builds browse for the given platform: gn gen with config/args/common.gn +
# config/args/<platform>.gn, then autoninja chrome.
# Usage: build.sh [mac|windows|linux] (default: host platform)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/chromium/src"
DEPOT="$ROOT/chromium/depot_tools"
export PATH="$DEPOT:$PATH"

case "${1:-auto}" in
  mac|windows|linux) PLATFORM="$1" ;;
  auto)
    case "$(uname -s)" in
      Darwin) PLATFORM=mac ;;
      Linux) PLATFORM=linux ;;
      MINGW*|MSYS*|CYGWIN*) PLATFORM=windows ;;
      *) echo "build: unsupported host $(uname -s)" >&2; exit 1 ;;
    esac ;;
  *) echo "usage: build.sh [mac|windows|linux]" >&2; exit 1 ;;
esac

[[ -d "$SRC" ]] || { echo "build: no checkout — run fetch-chromium.sh first" >&2; exit 1; }

OUT="out/browse-$PLATFORM"
ARGS="$(cat "$ROOT/config/args/common.gn" "$ROOT/config/args/$PLATFORM.gn")"

echo "build: gn gen $OUT"
(cd "$SRC" && gn gen "$OUT" --args="$ARGS")

echo "build: autoninja chrome ($PLATFORM)"
(cd "$SRC" && autoninja -C "$OUT" chrome)

echo "build: done — binary in chromium/src/$OUT"
