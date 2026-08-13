#!/usr/bin/env bash
# Fetches depot_tools and a Chromium checkout at the pinned version
# (chromium_version.txt) into ./chromium/. First run downloads >30 GB and
# takes hours — run on the build machine, not on a laptop battery.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(tr -d '[:space:]' < "$ROOT/chromium_version.txt")"
WORK="$ROOT/chromium"
DEPOT="$WORK/depot_tools"

mkdir -p "$WORK"

if [[ ! -d "$DEPOT" ]]; then
  echo "fetch: cloning depot_tools"
  git clone --depth 1 https://chromium.googlesource.com/chromium/tools/depot_tools.git "$DEPOT"
fi
export PATH="$DEPOT:$PATH"

if [[ ! -d "$WORK/src" ]]; then
  echo "fetch: initial chromium fetch (this is the big one)"
  (cd "$WORK" && fetch --nohooks chromium)
fi

echo "fetch: checking out tags/$VERSION"
(
  cd "$WORK/src"
  git fetch --tags origin "refs/tags/$VERSION:refs/tags/$VERSION" || git fetch origin --tags
  git checkout "tags/$VERSION"
  gclient sync -D --with_branch_heads --with_tags
  gclient runhooks
)
echo "fetch: done — src is at $VERSION"
