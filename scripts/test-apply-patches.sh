#!/usr/bin/env bash
# Self-test for apply-patches.sh without a Chromium checkout: builds a tiny git
# repo plus two overlapping patches (the second rewrites lines the first one
# added, exactly like 012 does to 011) and checks
#   fresh apply → re-run skips everything → a hand edit invalidates the stamp
#   → series with a missing final newline still applies its last patch.
# Usage: scripts/test-apply-patches.sh   (exit 0 = all checks passed)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPLY="$ROOT/scripts/apply-patches.sh"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/browse-apply-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

fail() { echo "test-apply-patches: FAIL — $*" >&2; exit 1; }
g() { git -C "$WORK/src" -c user.name=t -c user.email=t@t "$@"; }

mkdir -p "$WORK/src" "$WORK/patches"
g init -q
printf 'a\nb\nc\n' > "$WORK/src/f.txt"
g add f.txt && g commit -qm base

# patch 1 adds a helper line; patch 2 rewrites exactly that line and adds a
# new file — generated as diffs between three commits, then reset to base
printf 'a\nb\nhelper-v1\nc\n' > "$WORK/src/f.txt"
g commit -qam v1
printf 'a\nb\nhelper-v2\nc\n' > "$WORK/src/f.txt"
printf 'new\n' > "$WORK/src/new.txt"
g add -A && g commit -qm v2
g diff HEAD~2 HEAD~1 > "$WORK/patches/001-one.patch"
g diff HEAD~1 HEAD > "$WORK/patches/002-two.patch"
g reset -q --hard HEAD~2

printf '001-one.patch\n# comment\n\n002-two.patch\n' > "$WORK/patches/series"

run() { BROWSE_CHROMIUM_SRC="$WORK/src" BROWSE_PATCHES_DIR="$WORK/patches" "$APPLY"; }

# 1. fresh checkout
out="$(run)" || fail "fresh apply failed: $out"
grep -q 'done (2 newly applied)' <<<"$out" || fail "fresh apply: $out"
grep -qx 'helper-v2' "$WORK/src/f.txt" || fail "fresh apply: wrong content"
[[ -f "$WORK/src/new.txt" ]] || fail "fresh apply: new file missing"

# 2. re-run — before the stamp this re-applied 001 and conflicted
before="$(cat "$WORK/src/f.txt" "$WORK/src/new.txt" | shasum)"
out="$(run)" || fail "re-run failed (overlapping patches): $out"
grep -q 'done (0 newly applied)' <<<"$out" || fail "re-run: $out"
[[ "$(grep -c 'already applied (stamp)' <<<"$out")" -eq 2 ]] || fail "re-run did not use the stamp: $out"
[[ "$(cat "$WORK/src/f.txt" "$WORK/src/new.txt" | shasum)" == "$before" ]] || fail "re-run changed the tree"

# 3. hand edit → stamp invalid → old reverse check → 001 cannot be verified,
#    the script must stop with an explanation instead of silently passing
printf 'a\nb\nhelper-v2\nc\nedited\n' > "$WORK/src/f.txt"
if out="$(run 2>&1)"; then fail "edited tree was accepted: $out"; fi
grep -q 'stamp does not match' <<<"$out" || fail "edited tree: no stale-stamp notice: $out"
grep -q 'does not apply cleanly' <<<"$out" || fail "edited tree: no hint: $out"

# 4. reset + series without a final newline
g reset -q --hard && rm -f "$WORK/src/new.txt" "$WORK/src/f.txt.rej" "$WORK/src/f.txt.orig"
rm -f "$(git -C "$WORK/src" rev-parse --absolute-git-dir)/browse-patches.stamp"
printf '001-one.patch\n002-two.patch' > "$WORK/patches/series"
out="$(run)" || fail "no-final-newline series failed: $out"
grep -q 'done (2 newly applied)' <<<"$out" || fail "last series line skipped: $out"

echo "test-apply-patches: all checks passed"
