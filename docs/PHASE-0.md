# Phase 0 — Fundament

Ziel laut `BROWSE_PLAN.md`: Build-/Merge-Pipeline, Branding, Telemetrie-
Entfernung, Defaults, uBlock Origin gebündelt, MV2 keep-alive → interner
Prototyp.

## Status

| # | Baustein | Stand |
| --- | --- | --- |
| 1 | Versions-Pinning (Chromium `152.0.7977.42`, uBO `1.73.0` + SHA-256) | ✅ `chromium_version.txt`, `extensions/ublock.lock` |
| 2 | Fetch-Pipeline (depot_tools + Checkout at tag) | ✅ `scripts/fetch-chromium.sh` (noch nicht auf Builder gelaufen) |
| 3 | Patch-Overlay-Mechanik | ✅ `scripts/apply-patches.sh` + `patches/series` (leer, bewusst: Patches entstehen gegen echten Checkout) |
| 4 | Telemetrie-freie Build-Args | ✅ `config/args/*.gn` (Validierung gegen echten Checkout steht aus) |
| 5 | Defaults (Preferences + Policies inkl. `ExtensionManifestV2Availability`) | ✅ `config/initial_preferences.json`, `config/policies/managed/` |
| 6 | Branding-Identität | ✅ `config/branding/identity.md` (Icons offen, Branding-Patch folgt) |
| 7 | uBlock Origin gebündelt | ✅ `scripts/fetch-ubo.sh` — voll (MV2, für Patch-Builds archiviert) + Lite (MV3, Dev-Shell), Checksum-verifiziert |
| 8 | Dev-Shell-Prototyp (Chromium-Snapshot + Defaults + uBO Lite, ohne Compile) | ✅ `scripts/dev-shell.sh` — Smoke lokal bestanden (Chromium 153.0.8006.0, uBO Lite via CDP geladen) |
| 9 | CI: Lint + Config-Validierung + Smoke | ✅ `.github/workflows/ci.yml` |
| 10 | Build-Runner | ✅ entschieden (siehe `docs/BUILD-RUNNER.md`): Linux = Hetzner CCX63 on-demand (`scripts/cloud-build.sh`), macOS = M1 Max + externe NVMe, Windows zurückgestellt |
| 11 | Erster voller Fetch + Build (Linux, CCX63) | ⬜ wartet auf `HCLOUD_TOKEN` (Hetzner-Cloud-Projekt, Inhaber-Aufgabe) |
| 12 | Patches 001–003 (Branding, MV2, Store-Anonymisierung) | ⬜ blockiert durch 11 |

## Dev-Shell benutzen

```bash
./scripts/dev-shell.sh          # Prototyp starten (GUI)
./scripts/dev-shell.sh --smoke  # Headless-Check: Browser startet, uBO geladen
./scripts/dev-shell.sh --reset  # Dev-Profil zurücksetzen
```

Der Dev-Shell nutzt einen rohen Chromium-Snapshot (nicht Chrome): dort
funktioniert `--load-extension` und der MV2-Stand entspricht Upstream. Er
beantwortet die Phase-0-Kernfrage „wie fühlen sich die browse-Defaults an?"
ohne stundenlangen Compile.

## Befunde aus dem Prototyp-Aufbau (2026-08-13)

Alle drei gegen den Chromium-Snapshot 153.0.8006.0 (mac_arm) verifiziert:

1. **`--load-extension` ist tot.** Upstream ignoriert den Switch seit ~M137
   (Feature `DisableLoadExtensionCommandLineSwitch`); auch mit
   `--disable-features=…` wurde keine Extension mehr registriert.
   Funktionierender Weg: `--enable-unsafe-extension-debugging` + CDP
   `Extensions.loadUnpacked` — so macht es der Dev-Shell.
2. **MV2 ist upstream hart abgeschaltet.** `Extensions.loadUnpacked` mit dem
   vollen uBlock Origin liefert „Cannot install extension because it uses an
   unsupported manifest version" — Feature-Flags UND die Policy
   `ExtensionManifestV2Availability` (macOS defaults) bleiben wirkungslos.
   → Patch `002-mv2-keepalive.patch` ist damit belegt notwendig (Brave-Weg),
   nicht nur nice-to-have. Bis dahin fährt der Dev-Shell uBO **Lite** (MV3).
3. **CDP-Weg funktioniert zuverlässig** für MV3: uBO Lite lädt headless wie
   im GUI-Modus (Smoke-Test in CI verankert).

## Offene Entscheidungen

1. ~~Build-Infrastruktur~~ → entschieden, siehe `docs/BUILD-RUNNER.md`.
2. ~~MV2-Strategie~~ → geklärt: Policy greift nicht mehr (siehe Befunde),
   Patch 002 ist der Weg.
3. **Icon/Logo:** eigenes Icon-Set beauftragen (siehe `config/branding/identity.md`).
