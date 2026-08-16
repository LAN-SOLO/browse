# browse — Roadmap (Phasen & Patches)

> Fortschreibung von `BROWSE_PLAN.md` mit dem konkreten Stand nach Phase 0.
> Leitprinzip bleibt Patch-Minimalismus (Helium-Lehre): so wenig Engine-Patches
> wie möglich, Features bevorzugt über Prefs/Policies/gebündelte Extensions.
> Jeder Engine-Patch verteuert jeden Upstream-Merge.

## Stand (2026-08-16)

- **Phase 0 abgeschlossen.** `browse.app` (152.0.7977.42) baut und läuft auf dem
  M1 Max (Checkout + Build auf externer SSD).
- **Patches 001–008 im Overlay** (`patches/`, `series`), alle am Binary
  verifiziert: Branding, MV2 keep-alive, X-Client-Data unterdrückt, Sleeping
  Tabs default an, uBlock Origin ab Werk aktiv, Default-Suche DuckDuckGo,
  Safe Browsing ohne Realtime-Lookups, restliche Google-Hintergrunddienste
  gekappt.
- **Patch 009 (Widevine) blockiert** — braucht einen Lizenzvertrag mit
  Google; Inhaber-Aufgabe, kein Code-Blocker.
- **Patch 010 teilweise umgesetzt:** die Client-Hints-Hälfte
  (`010-reduce-client-hints.patch`) ist geschrieben, angewendet und baut
  gerade; Canvas-/Audio-Noise folgt getrennt als `011` (Begründung siehe
  Backlog-Tabelle) — Patch-Minimalismus heißt auch: den riskanteren,
  größeren Teil nicht an den kleinen, gut verifizierbaren Teil koppeln.
- Dev-Shell, CI, Monitoring, Build-Pipeline stehen.

## Patch-Backlog (nach Aufwand & Wirkung sortiert)

Reihenfolge = empfohlene Umsetzung. „Größe" = grobe Patch-/Build-Komplexität.

| # | Patch | Größe | Wirkung | Ansatz |
| --- | --- | --- | --- | --- |
| 005 | **uBlock Origin vorinstalliert** | M | hoch — Adblock ab Werk, das Kernversprechen sichtbar | uBO als gebündelte External-Extension ausliefern (JSON + gepacktes CRX im App-Bundle); nutzt Patch 002. Kein Update-Server nötig, Version gepinnt. |
| 006 | **Default-Suchmaschine entgooglen** | S | mittel — Privacy-Haltung | Prebuilt-Suchanbieter-Liste: datenschutzfreundliche Default (z. B. DuckDuckGo), Google bleibt wählbar. `template_url_prewritten`/`search_engines`. |
| 007 | **Safe Browsing ohne Google-Verlauf** | M | mittel-hoch — schützt ohne Datenabfluss | Standard-Safe-Browsing (lokale Listen-API v4) beibehalten, aber „Enhanced"/Realtime-Lookups aus; ggf. eigener/proxied Update-Endpoint. Vermeidet ungoogled-Fehler (Schutz ganz weg). |
| 008 | **Restliche Google-Hintergrunddienste kappen** | M | mittel — Degoogling vervollständigen | Field-Trials/Variations-Fetch, Domain-Reliability, GCM/Push-Anmeldung, Translate-Backend gezielt deaktivieren (viele als GN-Arg/Feature-Flag statt Codepatch). |
| 009 | **Widevine-DRM** | L | hoch für Streaming-Nutzer | Widevine-Lizenz + `enable_widevine=true`; erst nach Lizenzvertrag. Bis dahin ehrlich kommuniziert (Landing-Page-Disclaimer steht). **Blockiert auf Inhaber (Lizenz).** |
| 010 | **Fingerprinting-Schutz — Client Hints** | S | mittel — schließt eine kostenlose Fingerprint-Quelle | ✅ **umgesetzt** (`010-reduce-client-hints.patch`): `kUA`/`kUAMobile`/`kUAPlatform` sind die einzigen Client Hints, die Upstream ohne Site-Opt-in an jede Origin schickt (`blink::IsClientHintSentByDefault`, konsumiert von `content/browser/client_hints`' `IsClientHintEnabled`). Patch macht sie wie jeden High-Entropy-Hint opt-in-pflichtig (Accept-CH); `Save-Data` bleibt an, da nutzergewählte Präferenz statt Geräte-Fingerprint. Einzeiliger, gut umrissener Eingriff in eine Funktion — genau das Kaliber, das Patch-Minimalismus erlaubt. |
| 011 | **Fingerprinting-Schutz — Canvas-/Audio-Noise (Modus)** | L | hoch — Alleinstellung, aber am schwersten korrekt zu bauen | Optionaler gehärteter Modus (Canvas/Audio-Noise, reduzierte Client Hints) nach Brave/Mullvad-Vorbild; als Setting togglebar, Standard = sinnvoll moderat. Bewusst von 010 getrennt: Noise-Injektion in Blinks Canvas2D/WebAudio ist ein deutlich größerer, riskanterer Eingriff (Regressionsgefahr für legitime Canvas-/Audio-Nutzung) als das Client-Hints-Predicate — verdient eigenen Entwurf + Review-Zyklus statt an den kleinen, bereits verifizierten Patch angehängt zu werden. |

## Phase 1 — Komfort & Sichtbares (nach Patches 005–008)

Ziel: browse fühlt sich als eigenständiges Produkt an, nicht als Chromium mit
anderem Namen. Öffentliche Beta.

| Feature | Größe | Ansatz / Risiko |
| --- | --- | --- |
| **Sleeping Tabs** | — | ✅ erledigt (Patch 004) |
| **Vertikale Tabs / Sidebar** | XL | Größter Brocken. Chromium hat `features::kSideBySide`/Tab-Strip-Umbau in Arbeit; prüfen, was M152+ nativ kann, und darauf aufsetzen statt eigene Tab-UI zu bauen (SigmaOS-Warnung: nicht die Grundzuverlässigkeit opfern). Ggf. als WebUI-Sidebar. |
| **Shields-UI mit Block-Zähler** | L | uBO liefert die Zahlen bereits; browse-eigenes Popup/Action, das den uBO-Zähler pro Site anzeigt + Toggle. Aufsetzen auf Patch 005. |
| **Command Bar (Cmd/Ctrl+K)** | L | Omnibox erweitern oder WebUI-Overlay, das Tabs+Verlauf+Lesezeichen+Aktionen durchsucht (Arc-Vorbild). |
| **Split View** | L | Chromium hat experimentelles `SideBySide`; als Feature-Flag aktivieren/stabilisieren statt neu bauen. |
| **Workspaces/Spaces** | XL | Auf Chromiums Tab-Groups + Profile aufbauen; eigenes Persistenz-/Umschalt-UI. Nach vertikalen Tabs. |

## Phase 2 — Release-Fähigkeit (parallel zu Phase 1 vorbereiten)

| Baustein | Größe | Ansatz |
| --- | --- | --- |
| **Linux-Build** | M | `cloud-build.sh` (Hetzner CCX63 on-demand) liegt bereit; braucht Hetzner-Token. Erst dann Linux-Releases. |
| **Windows-Build** | L | GitHub-Windows-Runner oder Windows auf Builder-Server; Cross-Build vom Mac unrealistisch. |
| **Code-Signing & Notarisierung (macOS)** | M | Apple Developer Account; `package.sh` (Stub) ausbauen → notarisiertes DMG. Blocker für Verteilung. |
| **Update-Server** | M | `updates.lan-solo.com`: signierte Delta-Updates, sieht nur Versionsnummer (Plan §4.4). Der vorhandene Hostinger-VPS reicht dafür. |
| **Installer** | M | deb/rpm/Flatpak (Linux), mini_installer (Windows), DMG (macOS). |
| **E2E-verschlüsselter Sync** | L | Zero-Knowledge wie Secrets/all backed; eigener Sync-Endpoint statt Google-Sync. |

## Phase 3 — Alleinstellung

- **Firefox-Add-on-Kompatibilität** (WebExtension-Übersetzungsschicht, Orion-Lücke) —
  ambitioniertestes Stück, gestaffelt nach API-Popularität.
- **all-backed-Integration ohne Storage-Quota** (privilegierte Einbindung).
- **Boosts** (Custom CSS/JS pro Site, Arc-Vorbild).

## Nicht-Code-Aufgaben (Inhaber)

- **Icon-Set** — eigenes Logo/Icon; bis dahin trägt browse das Chromium-Icon.
- **Apple Developer Account** (Signing/Notarisierung, Phase 2).
- **Widevine-Lizenz** (Patch 009).
- **Hetzner-Token** — sobald Linux-Release-Builds anstehen.

## Merge-/Wartungsstrategie

- Bei jedem Chromium-Stable-Bump: `chromium_version.txt` hochziehen,
  `apply-patches.sh` gegen den neuen Checkout laufen lassen, Konflikte sofort
  lösen. Der kleine Patchset (aktuell 4 winzige Eingriffe) hält das billig.
- Security-Fixes zeitnah (< 72 h Ziel, `docs/BUILD-RUNNER.md`).
