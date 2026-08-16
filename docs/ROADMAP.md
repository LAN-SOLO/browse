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
- **Patch 010 (Client Hints) umgesetzt & verifiziert.**
- **Patch 011 (Canvas-Noise für `getImageData`) umgesetzt & verifiziert.**
- **Patch 012 (Canvas-Noise für `toDataURL`/`toBlob`) umgesetzt & verifiziert.**
  Noise-Algorithmus aus 011 in `platform/graphics/canvas_noise.{h,cc}`
  extrahiert (ein Ort, eine Review).
- **Patch 013 (WebAudio-Noise für `AudioBuffer`) umgesetzt & verifiziert.**
  Dritter und letzter der drei klassischen Fingerprint-Vektoren (Canvas ×2 +
  Audio) geschlossen. UI-Toggle für den gesamten Modus folgt als `014`.
- Dev-Shell, CI, Monitoring, Build-Pipeline stehen.
- **Bekannte Einschränkung:** `apply-patches.sh`s Idempotenz-Check
  (`git apply --check --reverse`) kann sich irren, wenn ein späterer Patch
  dieselbe Stelle wie ein früherer verändert (erstmals bei 011→012, dann
  wieder bei 013 wegen `canvas_noise.{h,cc}`) — er prüft, ob JEDER Patch
  für sich allein reversibel ist, nicht ob die kumulative Kette angewendet
  wurde. Betrifft nur die Selbstprüfung gegen einen bereits vollständig
  gepatchten Checkout, nicht die eigentliche Anwendung auf einen frischen
  Checkout (dort zuverlässig gegengetestet: 011→012→013 nacheinander aus
  dem echten Vor-011-Zustand angewendet → bytegleich zu HEAD).

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
| 011 | **Fingerprinting-Schutz — Canvas-Noise (`getImageData`)** | M | hoch — deckt den meistgenutzten Canvas-Fingerprint-Vektor | ✅ **umgesetzt** (`011-canvas-noise.patch`): `BaseRenderingContext2D::getImageDataInternal` (gemeinsame Basis für `<canvas>` UND `OffscreenCanvas`) perturbiert nach erfolgreichem `readPixels` ~1 von 8 Pixeln um ±1 auf einem RGB-Kanal (nie Alpha). Seed = Prozess-Zufallssalt XOR `base::Hash(Origin)` — stabil pro Origin für die Prozesslaufzeit, unterschiedlich zwischen Origins, neu nach Neustart. Verifiziert per CDP gegen das gebaute Binary: gleiche Origin/zweiter Read → bytegleich; zwei Origins, identische Zeichnung → unterschiedlicher Pixel-Checksum, Mittelwert-Differenz 0.0008 (unsichtbar). Musste auf `gfx::SkPixmapToWritableSpan` umgestellt werden — rohe Pointer-Arithmetik verletzt Chromiums `-Wunsafe-buffer-usage`. |
| 012 | **Fingerprinting-Schutz — `toDataURL`/`toBlob`-Noise** | M | mittel-hoch — zweiter und dritter klassischer Canvas-Fingerprint-Vektor | ✅ **umgesetzt** (`012-canvas-export-noise.patch`): `toDataURL`/`toBlob` (inkl. `OffscreenCanvas.convertToBlob`, gleiche `CanvasAsyncBlobCreator`-Klasse) lesen ihre Pixel über `SkImage::peekPixels()` — Zero-Copy-Sicht auf Speicher, den das Bild noch selbst besitzt (evtl. geteilt mit dem laufenden Canvas-Rendering). Neuer Helfer `MakePrivateCanvasSnapshotAndApplyNoise` erzwingt per `readPixels()` erst eine private Kopie, bevor gerauscht wird — sonst Korruptionsrisiko für geteilte Bilder. `ImageDataBuffer::ApplyOriginNoise()` ist bewusst opt-in: `ImageDataBuffer` wird auch von DevTools-Audits, Accessibility und Video-Poster-Capture genutzt, die keine JS-exponierte Fingerprint-Fläche sind. Verifiziert per CDP: `toDataURL`/`toBlob` je stabil pro Origin, unterschiedlich zwischen Origins (auch unterschiedliche PNG-Byte-Länge); `getImageData`-Regression nach dem Refactor geprüft — funktioniert weiter. |
| 013 | **Fingerprinting-Schutz — WebAudio-Noise** | L | mittel — dritter, seltener genutzter Vektor | ✅ **umgesetzt** (`013-audio-noise.patch`): `AudioBuffer::getChannelData`/`copyFromChannel` (das klassische OfflineAudioContext-Rezept: Oszillator + Dynamics Compressor rendern, Samples zurücklesen, hashen). Anders als Canvas-Pixel ist `getChannelData()` laut Spezifikation eine **live, veränderbare** Sicht auf den Puffer — Rauschen wird deshalb nur **einmal pro Kanal** angewendet (`channel_noise_applied_`-Tracking), sonst würde es bei wiederholten Reads akkumulieren. Amplitude ±2e-7 auf ~1 von 8 Samples — eine Größenordnung unter dem 16-Bit-Quantisierungsrauschen, weit unter jeder Hörbarkeitsschwelle. Brauchte `CallWith=ScriptState` in der IDL, um an die aufrufende Origin zu kommen (`AudioBuffer` speichert selbst keinen Execution-Context). Verifiziert per CDP: stabil bei wiederholtem Read, `copyFromChannel` stimmt exakt mit `getChannelData` überein, unterschiedliche Origins → unterschiedliche Werte bei identischem Rendering. `AnalyserNode`-Frequenzanalyse (zweiter, selteneren Audio-Fingerprint-Vektor) bewusst nicht mit abgedeckt — eigener Follow-up-Patch bei Bedarf. |
| 014 | **Fingerprinting-Schutz — UI-Toggle ("Modus")** | S | UX — macht 011–013 abschaltbar | 011–013 greifen bisher fest (kein Opt-out); ein Setting + Pref bündelt alle drei, Standard = an. 011–013 stehen jetzt alle — als Nächstes dran. |

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
