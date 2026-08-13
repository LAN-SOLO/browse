#!/usr/bin/env bash
# Packaging stub (Phase 0): will produce signed installers per platform.
#   mac:     .app → notarized .dmg (universal via universalizer)
#   windows: mini_installer → signed .exe / winget manifest
#   linux:   .deb, .rpm, Flatpak
# Blocked on: signing certificates + Apple notarization account (Phase 2 gate).
set -euo pipefail
echo "package: not implemented yet — see BROWSE_PLAN.md roadmap (Phase 0 stub)" >&2
exit 1
