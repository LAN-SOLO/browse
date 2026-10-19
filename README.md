# browse

Eigener Desktop-Webbrowser auf Chromium-Basis für Windows, macOS und Linux.
Positionierung: „das Beste aus allen Browsern" — eingebauter Werbeblocker mit
MV2-Weiterbetrieb (volles uBlock Origin), Extensions aus Chrome- **und**
Firefox-Store, Container, vertikale Tabs/Workspaces, Command Bar, null
Telemetrie. Heimat unserer eigenen Tools: all backed läuft in browse ohne
Extension-Speichergrenzen.

Produktseite: https://lan-solo.com/de/tools/browse/ · Plan: `BROWSE_PLAN.md`
(Recherche, Architektur, Sicherheitskonzept, Roadmap).

## Status

**Phase 0 (Fundament) läuft** — Stand und Befunde: `docs/PHASE-0.md`.
Versions-Pinning, Fetch-/Build-/Patch-Pipeline, telemetriefreie Build-Args,
Defaults/Policies und CI stehen; der Dev-Shell-Prototyp startet einen
Chromium-Snapshot mit browse-Defaults und uBlock Origin Lite:

```bash
./scripts/dev-shell.sh          # Prototyp starten (GUI)
./scripts/dev-shell.sh --smoke  # Headless-Check (läuft auch in CI)
```

Patches 001–014 sind am macOS-Binary verifiziert (`patches/series`,
`docs/ROADMAP.md`). Audit-Stand, offene Blocker (kein Updater, keine Signatur,
Windows/Linux ohne vorinstallierte Extensions) und was nur ein Build prüfen
kann: **`AUDIT-1.0.md`**.

## Tests (ohne Chromium-Build)

```bash
./scripts/test-apply-patches.sh                 # Patch-Overlay idempotent (überlappende Patches)
node scripts/test-handbook.mjs <chromium-binary> # Handbuch-Extension E2E (DE/EN, hell/dunkel, 360 px)
./scripts/dev-shell.sh --smoke                  # Prototyp startet, uBO Lite lädt
```

Als `<chromium-binary>` taugt jeder Chromium ≥ 116, z. B. der Dev-Shell-Snapshot
(`cat .cache/chromium-bin-path.txt`). Alle drei laufen auch in CI.

Hinweis: `./chromium` ist lokal oft ein Symlink auf eine Build-Platte und
steht bewusst nicht in git.

## Verwandte Repositories

- [webpage](https://github.com/LAN-SOLO/webpage) — lan-solo.com inkl. Landing Page (`/[lang]/tools/browse/`)
- [all-backed](https://github.com/LAN-SOLO/all-backed) — Backup-Extension, in browse privilegiert integriert
- [secrets](https://github.com/LAN-SOLO/secrets) — Zero-Knowledge-Secret-Sharing
