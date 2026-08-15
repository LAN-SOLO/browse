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
| 10 | Build-Runner | ✅ entschieden, revidiert auf serverlos (siehe `docs/BUILD-RUNNER.md`): erster Build macOS-arm64 lokal auf dem M1 Max + externe SSD; Linux/Windows in Phase 2 (`cloud-build.sh` liegt bereit) |
| 11 | Erster voller Fetch + Build (macOS, lokal) | ✅ **2026-08-15: Chromium.app (360 MB) baut und startet** — `Chromium 152.0.7977.42`, 53.212 Schritte auf dem M1 Max, Checkout + Build auf der externen SSD |
| 12 | Patches 001–003 (Branding, MV2, Store-Anonymisierung) | ✅ **2026-08-16: gebaut & verifiziert** — `browse.app` / `com.lan-solo.browse` / `browse 152.0.7977.42`; volles uBlock Origin (MV2) lädt und läuft (Background-Seite aktiv); X-Client-Data unterbunden. Patches in `patches/`, `series` gefüllt |

**Phase 0 abgeschlossen.** Nächster Block: eigenes Icon-Set (Inhaber), dann Phase 1
(vertikale Tabs, Shields-UI, Sleeping Tabs).

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

## Befunde aus dem ersten vollen Build (2026-08-14/15, macOS arm64)

1. **PGO braucht Profile im Checkout** — `is_official_build=true` schlägt ohne
   sie fehl. Dev-Builds: `chrome_pgo_phase = 0`; Release-Builds aktivieren
   stattdessen die gclient-Var `checkout_pgo_profiles` + runhooks.
2. **Xcode 26 bündelt die Metal-Toolchain nicht mehr** — ANGLEs Shader-Schritt
   scheitert sonst. `xcodebuild -downloadComponent MetalToolchain`; Achtung:
   der erste Download meldete „Install Succeeded", blieb aber „uninstalled"
   (Versions-Mismatch) — Status mit `xcodebuild -showComponent MetalToolchain`
   prüfen, ggf. wiederholen.
3. **Siso erkennt Agent-Umgebungen** (`CLAUDECODE`/`AI_AGENT` env) und schaltet
   auf `--quiet` — für sichtbaren `[n/total]`-Fortschritt diese Variablen beim
   Spawnen entfernen (`env -u`).
4. `enable_nacl` existiert in M152 nicht mehr (NaCl entfernt).

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
