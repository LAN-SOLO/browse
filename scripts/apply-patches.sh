#!/usr/bin/env bash
# Applies patches/ in the order listed in patches/series onto chromium/src
# using git apply --3way. Safe to re-run:
#
#   1. After every applied patch a stamp (<checkout>/.git/browse-patches.stamp)
#      records the patch (name + sha256) together with a fingerprint of all
#      files the series touches. While that fingerprint still matches, a
#      recorded patch is skipped without testing it again.
#      Why: later patches may rewrite hunks of earlier ones (012 rewrites what
#      011 introduced). Such an earlier patch no longer reverse-applies on its
#      own, so a pure `apply --check --reverse` test re-applied it on every
#      re-run and hit a conflict (e.g. the cached checkout in cloud-build.sh).
#   2. Without a matching stamp (fresh checkout, files edited by hand, checkout
#      HEAD moved) a patch counts as applied when it reverse-applies cleanly.
#
# Overrides (tests): BROWSE_CHROMIUM_SRC, BROWSE_PATCHES_DIR.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${BROWSE_CHROMIUM_SRC:-$ROOT/chromium/src}"
PATCHES="${BROWSE_PATCHES_DIR:-$ROOT/patches}"
SERIES="$PATCHES/series"

[[ -d "$SRC" ]] || { echo "apply: no checkout at $SRC — run fetch-chromium.sh first" >&2; exit 1; }
[[ -f "$SERIES" ]] || { echo "apply: no series file at $SERIES" >&2; exit 1; }

STAMP="$(git -C "$SRC" rev-parse --git-path browse-patches.stamp)"
[[ "$STAMP" == /* ]] || STAMP="$SRC/$STAMP"

# series entries without blanks/comments; tolerates a missing final newline
series_names() {
  local name
  while IFS= read -r name || [[ -n "$name" ]]; do
    [[ -z "$name" || "$name" == \#* ]] && continue
    printf '%s\n' "$name"
  done < "$SERIES"
}

sha256() { shasum -a 256 "$1" | cut -d' ' -f1; }

# every path any series patch touches (post-image side of the diff header)
touched_paths() {
  local name
  series_names | while IFS= read -r name; do
    if [[ -f "$PATCHES/$name" ]]; then
      sed -n 's|^diff --git a/.* b/\(.*\)$|\1|p' "$PATCHES/$name"
    fi
  done | sort -u
}

# fingerprint = checkout HEAD + blob hash (or absence) of every touched path
fingerprint() {
  local p
  {
    git -C "$SRC" rev-parse HEAD
    while IFS= read -r p; do
      if [[ -f "$SRC/$p" ]]; then
        printf '%s %s\n' "$p" "$(git -C "$SRC" hash-object -- "$p")"
      else
        printf '%s -\n' "$p"
      fi
    done < <(touched_paths)
  } | shasum -a 256 | cut -d' ' -f1
}

APPLIED=()   # "name sha" of every patch considered applied, in series order
write_stamp() {
  local tmp="$STAMP.tmp" entry
  {
    printf 'fingerprint %s\n' "$(fingerprint)"
    for entry in "${APPLIED[@]}"; do printf 'patch %s\n' "$entry"; done
  } > "$tmp"
  mv -f "$tmp" "$STAMP"
}

RECORDED=""
if [[ -f "$STAMP" ]]; then
  if [[ "$(sed -n 's/^fingerprint //p' "$STAMP")" == "$(fingerprint)" ]]; then
    RECORDED="$(sed -n 's/^patch //p' "$STAMP")"
  else
    echo "apply: stamp does not match the checkout any more — testing every patch again"
  fi
fi

applied=0
while IFS= read -r name; do
  patch="$PATCHES/$name"
  [[ -f "$patch" ]] || { echo "apply: missing $patch (listed in series)" >&2; exit 1; }
  entry="$name $(sha256 "$patch")"
  if [[ -n "$RECORDED" ]] && grep -qxF -- "$entry" <<<"$RECORDED"; then
    echo "apply: $name already applied (stamp) — skipping"
    APPLIED+=("$entry")
    continue
  fi
  if git -C "$SRC" apply --check --reverse "$patch" >/dev/null 2>&1; then
    echo "apply: $name already applied — skipping"
    APPLIED+=("$entry")
    write_stamp
    continue
  fi
  echo "apply: $name"
  if ! git -C "$SRC" apply --3way "$patch"; then
    echo "apply: $name does not apply cleanly. If an older version of it (or of a later" >&2
    echo "apply: patch) is still in the checkout, reset the touched files to the pinned tag" >&2
    echo "apply: (git -C chromium/src checkout HEAD -- <files>, delete files the series adds)" >&2
    echo "apply: and run again." >&2
    exit 1
  fi
  APPLIED+=("$entry")
  write_stamp
  applied=$((applied + 1))
done < <(series_names)

write_stamp
echo "apply: done ($applied newly applied)"
