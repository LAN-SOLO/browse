#!/usr/bin/env bash
# browse dev shell — the Phase-0 prototype without compiling Chromium:
# a pinned Chromium snapshot launched with browse defaults (seeded
# preferences, degoogled runtime flags) plus uBlock Origin Lite loaded via
# CDP Extensions.loadUnpacked.
#
# Why Lite: upstream Chromium hard-refuses MV2 extensions since the 2025
# deprecation (verified — see extensions/ublock.lock). Full uBlock Origin
# returns with the browse MV2 patch (patches/002, real builds only).
#
# Usage:
#   dev-shell.sh          launch the prototype (GUI)
#   dev-shell.sh --smoke  headless smoke test: browser starts, uBO Lite
#                         actually loads, then exits
#   dev-shell.sh --reset  wipe the dev profile first
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="$ROOT/.cache"
PROFILE="$ROOT/.dev-profile"
PORT="${BROWSE_DEVTOOLS_PORT:-9558}"
SMOKE=0
for arg in "$@"; do
  case "$arg" in
    --smoke) SMOKE=1 ;;
    --reset) rm -rf "$PROFILE" ;;
    *) echo "usage: dev-shell.sh [--smoke] [--reset]" >&2; exit 1 ;;
  esac
done

# 1. uBlock builds (pinned + checksummed)
"$ROOT/scripts/fetch-ubo.sh"
# shellcheck source=/dev/null
source "$ROOT/extensions/ublock.lock"
UBOL_DIR="$CACHE/ubol/$UBOL_VERSION"

# 2. Chromium snapshot via @puppeteer/browsers (raw Chromium, not branded
#    Chrome: mirrors upstream defaults, no Google services wired in)
BIN_MARKER="$CACHE/chromium-bin-path.txt"
if [[ ! -f "$BIN_MARKER" ]] || [[ ! -x "$(cat "$BIN_MARKER")" ]]; then
  echo "dev-shell: fetching chromium snapshot (first run only)"
  OUT="$(npx --yes @puppeteer/browsers install chromium@latest --path "$CACHE/browsers")"
  # last line looks like: "chromium@<rev> <path>" — path may contain spaces
  echo "$OUT" | tail -1 | sed 's/^[^ ]* //' > "$BIN_MARKER"
fi
CHROMIUM="$(cat "$BIN_MARKER")"
[[ -x "$CHROMIUM" ]] || { echo "dev-shell: no chromium binary at $CHROMIUM" >&2; exit 1; }

# 3. Seed the profile with browse defaults on first run
if [[ ! -d "$PROFILE/Default" ]]; then
  mkdir -p "$PROFILE/Default"
  cp "$ROOT/config/initial_preferences.json" "$PROFILE/Default/Preferences"
  echo "dev-shell: seeded profile from config/initial_preferences.json"
fi

# Degoogled runtime surface (compile-time equivalents live in config/args/)
# shellcheck disable=SC2054  # commas are part of --disable-features values
FLAGS=(
  --user-data-dir="$PROFILE"
  --no-first-run
  --no-default-browser-check
  --disable-sync
  --disable-background-networking
  --disable-component-update
  --disable-domain-reliability
  --disable-breakpad
  --metrics-recording-only
  --disable-features=MediaRouter,OptimizationHints
  # extension loading happens over CDP, so both modes need the port
  --remote-debugging-port="$PORT"
  --enable-unsafe-extension-debugging
)
[[ "$SMOKE" -eq 1 ]] && FLAGS+=(--headless=new)

LOG="$CACHE/dev-shell.log"
"$CHROMIUM" "${FLAGS[@]}" about:blank >"$LOG" 2>&1 &
PID=$!
trap '[[ "$SMOKE" -eq 1 ]] && kill "$PID" 2>/dev/null || true' EXIT

up=0
for _ in $(seq 1 30); do
  if curl -4 -fs --max-time 2 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
    up=1; break
  fi
  kill -0 "$PID" 2>/dev/null || { echo "dev-shell: browser exited early (see $LOG)" >&2; exit 1; }
  sleep 1
done
[[ "$up" -eq 1 ]] || { echo "dev-shell: DevTools endpoint never came up (see $LOG)" >&2; exit 1; }

EXT_ID="$(node "$ROOT/scripts/cdp-load-extension.mjs" "$PORT" "$UBOL_DIR")" \
  || { echo "dev-shell: loading uBlock Origin Lite failed" >&2; exit 1; }
echo "dev-shell: uBlock Origin Lite loaded (id $EXT_ID)"
echo "dev-shell: note — full uBlock Origin (MV2) needs the browse MV2 patch; upstream refuses it"

if [[ "$SMOKE" -eq 1 ]]; then
  version="$(curl -4 -fs --max-time 5 "http://127.0.0.1:$PORT/json/version" | python3 -c 'import json,sys; print(json.load(sys.stdin)["Browser"])')"
  echo "dev-shell: smoke — browser up: $version"
  echo "dev-shell: smoke PASSED"
else
  echo "dev-shell: browse prototype running (pid $PID) — close the window to exit"
  wait "$PID"
fi
