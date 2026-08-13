# browse — Produkt- und Implementierungsplan

> Produkt: **browse** — eigener Desktop-Webbrowser auf Chromium-Basis für Windows, macOS
> und Linux. Positionierung: „das Beste aus allen Browsern" — eingebauter Werbeblocker,
> Extensions aus Chrome- **und** Firefox-Store, Container, vertikale Tabs/Workspaces,
> Command Bar, null Telemetrie. Außerdem Heimat unserer eigenen Tools: **all backed**
> läuft in browse ohne Extension-Speichergrenzen.
>
> Status: Planungsphase. Die Landing Page (`/[lang]/tools/browse/`) ist gebaut und
> weist das Produkt als „coming soon" aus. Die Browser-Entwicklung selbst bekommt —
> wie all backed (`../all-backed`) — ein eigenes Repository.

## 1. Rechercheergebnisse (Stand August 2026)

Umfassende Auswertung von Nutzer-Reviews, Foren und Fachartikeln zu Helium, Brave, Arc,
Zen, Vivaldi, Firefox, Chrome, Edge, Orion, SigmaOS, Opera, LibreWolf, Mullvad Browser,
Thorium und ungoogled-chromium. Kernbefunde:

### Was Nutzer lieben (Evidenz pro Browser)

| Browser | Geliebt | Größte Schwäche (vermeiden!) |
| --- | --- | --- |
| **Brave** | Shields mit sichtbarem Block-Zähler, per Site togglebar; MV2 force-enabled (volles uBlock Origin); beste RAM-Werte im Chromium-Lager | Krypto/BAT-Ballast, Affiliate-Skandal 2020 → Vertrauensschaden |
| **Arc** | Vertikale Sidebar, Spaces, Command Bar, Boosts (Custom CSS/JS pro Site) | Seit Mai 2025 Maintenance-Mode → Nutzervertrauen weg |
| **Firefox** | Multi-Account Containers; einziger Mainstream-Browser mit vollem `webRequest` (uBlock Origin uneingeschränkt); gutes Memory-Scaling bei vielen Tabs | Marktanteilsverfall, Web-Kompatibilität hinkt teils |
| **Vivaldi** | Tab-Stacking mit Farben, Tab-Tiling, Hibernation, extreme UI-Anpassbarkeit | Feature-Overload überfordert Gelegenheitsnutzer |
| **Helium** | Minimalistisch, uBlock Origin + Filterlisten vorinstalliert, anonymisierte Web-Store-Requests, keine Telemetrie, spürbar schnell | Kein Widevine-DRM (Streaming tot), kein Sync |
| **Edge** | Vertikale Tabs (seit 2021), Sleeping Tabs, Split View, niedrigster RAM bei 10 Tabs, MV2 behalten | Sidebar-Bloat, MS-Account-Nagging |
| **Zen** | Workspaces + vertikale Tabs + Container + Split View (4er-Grid), Compact Mode, Glance-Vorschau | Alpha-Reifegrad, Absturzserien, kein Widevine |
| **Orion (Kagi)** | **Einziger Browser mit Chrome- UND Firefox-Extensions** (~70 % API-Abdeckung), Safari-nahe RAM-Werte | Nur macOS stabil; Kompatibilität lückenhaft |
| **Opera** | Workspaces, Messenger-Sidebar, Battery Saver, MV2 behalten | Opera GX gilt als überladen/gimmicky |
| **LibreWolf** | Gehärtete Privacy-Defaults out-of-the-box, uBlock vorinstalliert | Härtung bricht Websites; Patches hinken Upstream hinterher |
| **Mullvad Browser** | Tor-Grade Fingerprinting-Schutz ohne Tor-Routing („Crowd"-Fingerprint) | Ohne VPN bleibt IP sichtbar |
| **Thorium** | Compiler-Optimierungen, bis 38 % schneller (Speedometer 2.1) | Ein-Mann-Projekt, 2+ Monate CVE-Patch-Lag → Sicherheitsrisiko |
| **ungoogled-chromium** | ~50 Google-Hintergrundverbindungen entfernt, volle Transparenz | Extension-Installation umständlich; Safe Browsing ersatzlos weg |
| **SigmaOS** | (Workspaces, Keyboard-Workflow) | **Warnbeispiel:** zu viel neu erfunden, Grundzuverlässigkeit (SSO, Extensions) geopfert → tot seit 2024 |

### Manifest-V3-Lage (zentraler Markttreiber)

- Chrome hat MV2 im Juli 2025 endgültig deaktiviert → volles uBlock Origin dort tot
  (nur noch „Lite" ohne volle Filterlisten/Cosmetic Filtering); ~40 Mio. Nutzer betroffen.
- Brave, Edge, Opera, Vivaldi halten MV2 am Leben; Firefox unterstützt `webRequest` voll.
- **Konsequenz für browse:** MV2-Weiterbetrieb ist technisch erprobt (vier große Forks)
  und DAS Differenzierungsmerkmal Nr. 1 gegenüber Chrome.

### Die 5 wichtigsten UX-Patterns (Nutzer-Evidenz)

1. **Vertikale Tabs + Sidebar als Standard** — Haupttreiber jedes Arc/Zen/Edge-Umstiegs;
   inzwischen Erwartungshaltung (auch Chrome zog im März 2026 nach).
2. **Workspaces/Spaces** — universell gelobt (Arc, Zen, Opera, Vivaldi); reduziert
   kognitive Last am stärksten.
3. **MV2 + volles uBlock Origin** — konkretester Frustpunkt der Chrome-Nutzer; günstigster
   Vertrauensgewinn für einen neuen Browser.
4. **Command Bar** (Tabs + Verlauf + Lesezeichen + Aktionen in einer Eingabe) —
   Arc-Nutzer nennen es konsistent den Produktivitäts-Gamechanger; flacher als
   Shortcut-Lastigkeit à la SigmaOS.
5. **Per-Site-Shields mit sichtbarem Zähler** — Transparenz statt Silent-Blocking;
   Nutzer können Seitenbrüche selbst beheben (LibreWolf-Problem vermieden).

## 2. Produktdefinition

### Kernversprechen (= Sektionen der Landing Page)

1. **Werbeblocker ohne Kompromisse** — nativer Blocker (Filterlisten + Cosmetic
   Filtering) und MV2-Weiterbetrieb für das echte uBlock Origin.
2. **Chrome- und Firefox-Extensions** — Chrome Web Store ab Werk; Firefox-Add-on-
   Kompatibilitätsschicht als Alleinstellungsmerkmal (Orion-Lücke: kein Chromium-Fork
   bietet das, Orion ist WebKit/macOS-only).
3. **Container & Profile** — Firefox-artige Container-Tabs (getrennte Cookie-Jars)
   plus klassische Profile.
4. **Vertikale Tabs & Workspaces** — Sidebar-first, komplett ausblendbar.
5. **Command Bar** — eine Eingabe für Tabs, Verlauf, Lesezeichen, Aktionen.
6. **Split View & Link-Vorschau** — nativ, ohne Add-ons.
7. **E2E-verschlüsselter Sync** — Zero-Knowledge wie Secrets/all backed.
8. **Null Telemetrie** — Update-Server erfährt nur die Versionsnummer.
9. **all backed ohne Grenzen** — privilegierte Integration unseres Backup-Tools
   (keine Storage-Quota, direkte Laufwerkszugriffe, zuverlässige Zeitpläne).

### Was browse bewusst NICHT bekommt

- Keine Krypto-Token/Rewards (Brave-Lehre)
- Kein Sidebar-Bloat, keine gesponserten Verknüpfungen (Edge/Opera-Lehre)
- Keine agentische KI, die ungefragt handelt (2026er Kritikthema: Prompt Injection)
- Keine Innovation auf Kosten der Grundzuverlässigkeit (SigmaOS-Lehre)
- Kein Performance-Marketing mit Benchmark-Rosinen (Thorium-Lehre)

### Harte technische Randbedingungen (ehrlich einplanen!)

1. **Ein Chromium-Fork ist ein Dauerlauf, kein Sprint.** Chromium liefert alle ~4 Wochen
   Major-Releases und wöchentlich Security-Fixes. Ohne automatisierte Merge-/Build-
   Pipeline landet man im Thorium-Problem (CVE-Lag). → CI-first, kleiner Patchset.
2. **Patch-Minimalismus wie Helium:** So wenig wie möglich am Engine-Code ändern; Features
   bevorzugt in der UI-Schicht (Views/Frontend) und über eingebaute (Komponenten-)
   Extensions realisieren. Jeder Engine-Patch verteuert jeden Upstream-Merge.
3. **Widevine-DRM braucht eine Lizenz.** Ohne sie laufen Netflix/Disney+/Prime nicht
   (Helium/Zen-Schwäche). Lizenzprozess früh starten; bis dahin ehrlich kommunizieren.
4. **Firefox-Add-on-Kompatibilität ist das ambitionierteste Stück.** Orion schafft nach
   Jahren ~70 %. Realistisch: WebExtension-Übersetzungsschicht (moz-APIs → Chromium-
   Äquivalente), gestaffelt nach API-Popularität; XPI-Installation von addons.mozilla.org
   mit Signaturprüfung. Ehrlich als „schrittweise" kommunizieren (steht so auf der Seite).
5. **MV2-Weiterbetrieb** = Chromium-Flag/Patches wie bei Brave; zusätzlich eigene
   Extension-Update-Pipeline, falls Google MV2-Extensions aus dem Web Store entfernt
   (lokaler Mirror geprüfter Adblock-Extensions).
6. **Safe Browsing ersatzlos streichen ist keine Option** (ungoogled-chromium-Lehre).
   → Phishing-/Malware-Schutz über lokal gehaltene Listen (z. B. Safe-Browsing-Update-
   API v4 mit Proxy oder alternative Feeds), ohne Verlaufsübertragung an Google.

## 3. Architektur

```
┌─────────────────────────────────────────────────────────────┐
│  browse (Chromium-Fork, eigener Release-Train)              │
│                                                             │
│  Engine (minimal gepatcht)          UI-Schicht (Hauptarbeit)│
│  • MV2 keep-alive                   • Vertikale Sidebar     │
│  • Anonymisierte Store-Requests     • Workspaces/Spaces     │
│  • Telemetrie-Entfernung            • Command Bar (Cmd/Ctrl+K)│
│  • Container-StoragePartitions      • Split View, Glance    │
│  • Fingerprint-Randomisierung       • Shields-UI + Zähler   │
│                                                             │
│  Eingebaute Komponenten                                     │
│  • Adblock-Engine (Rust, Filterlisten + Cosmetic Filtering) │
│  • WebExtension-Compat-Layer (moz-API-Übersetzung)          │
│  • all-backed-Integration (privilegiert: unbegrenzte Quota, │
│    Laufwerkszugriff, nativer Scheduler)                     │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS — ausschließlich:
               ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│  Update-Server (LAN-SOLO)    │   │  Sync-Server (LAN-SOLO)   │
│  sieht nur Versionsnummer;   │   │  sieht nur E2E-verschlüs- │
│  signierte Releases,         │   │  selte Blobs; Schlüssel   │
│  Delta-Updates               │   │  entstehen beim Nutzer    │
└──────────────────────────────┘   └───────────────────────────┘
```

- **Container:** eigene `StoragePartition` pro Container (Chromium kann partitionierten
  Storage; Container-Tabs = leichtgewichtiger als volle Profile), farbcodiert in der UI.
- **Adblock:** eigene Engine nach Vorbild adblock-rust (Brave) — Netzwerk-Ebene im
  Browser-Prozess statt Extension → schneller und MV3-unabhängig; Filterlisten
  (EasyList & Co.) mit Auto-Update; Shields-UI pro Site mit Zähler und Toggle.
- **Sync:** Client-seitige Verschlüsselung (Argon2id-Passphrase → Schlüssel, AES-GCM),
  Server speichert nur Blobs. Gleiche Krypto-Philosophie wie Secrets/all backed.
- **Fingerprinting-Schutz:** Standard = sinnvolle Randomisierung (Canvas/Audio-Noise,
  reduzierte Client Hints); optionaler gehärteter Modus Richtung Mullvad/LibreWolf mit
  ehrlichem Hinweis auf mögliche Seitenbrüche.
- **Performance:** Sleeping Tabs (Edge-Vorbild), Upstream-Optimierungen statt riskanter
  Compiler-Rosinen; Benchmarks nur veröffentlichen, wenn reproduzierbar.

## 4. Sicherheitskonzept

1. **Update-Kadenz:** Security-Releases < 72 h nach Chromium-Stable-Fix (automatisierte
   Merge-Pipeline, CI-Builds für alle drei Plattformen, signiert + notarisiert).
2. **Sandbox unangetastet:** Keine Patches, die Chromiums Prozess-/Site-Isolation
   schwächen. Eigene Komponenten laufen mit minimalen Rechten.
3. **Berechtigungen:** Extension-Berechtigungen granular anzeigen; privilegierte
   LAN-SOLO-Integrationen (all backed) nur signiert und nur nach expliziter Aktivierung
   durch den Nutzer.
4. **Kein Datenabfluss:** Null Telemetrie, anonymisierte Store-Requests, Phishing-Schutz
   ohne Verlaufsübertragung, Crash-Reports nur lokal + optionaler manueller Versand.
5. **Transparenz:** Patchset öffentlich (Open-Source-Ansatz wie bei Secrets/Yopass
   kommuniziert), reproduzierbare Builds als Ziel.

## 5. Roadmap

| Phase | Inhalt | Ergebnis |
| --- | --- | --- |
| **0 — Fundament** | Build-/Merge-Pipeline (CI für Win/mac/Linux), Branding, Telemetrie-Entfernung, Defaults, uBlock Origin gebündelt, MV2 keep-alive | Interner Prototyp |
| **1 — MVP** | Native Adblock-Engine + Shields-UI, vertikale Sidebar + Workspaces, Sleeping Tabs, Update-Server | Private Alpha |
| **2 — Komfort** | Command Bar, Split View + Glance, Container-Tabs, E2E-Sync, Widevine-Lizenz | Öffentliche Beta (Ankündigung auf der Landing Page) |
| **3 — Alleinstellung** | WebExtension-Compat-Layer (Firefox-Add-ons, gestaffelt), gehärteter Privacy-Modus, all-backed-Integration ohne Quota | 1.0 |
| **4 — Ausbau** | Boosts (Custom CSS/JS pro Site), Tab-Stacking mit Farben, Enterprise-Policies | 1.x |

**Risiken:** Build-Infrastruktur-Kosten (Chromium-Builds sind schwer), Widevine-
Lizenzierung, Google-ToS bzgl. Web-Store-Zugriff, Pflegeaufwand des Compat-Layers.
Gegenmaßnahmen: Patch-Minimalismus, CI-Automatisierung, gestaffelte Versprechen
(die Landing Page verspricht Firefox-Support explizit als „angestrebt/schrittweise").

## 6. Bezug zur Website (dieses Repo)

- Landing Page: `app/[lang]/tools/browse/page.tsx` + `components/browse/BrowsePage.tsx`,
  Texte in `i18n/DE.ts`/`i18n/EN.ts` unter `browse`, OG-Bild `public/og-browse.png`
  (CoreGraphics-Skript, Stil wie `og-allbacked.png`).
- Navigation (Tools-Dropdown) und Footer verlinken auf `/​[lang]/tools/browse/`.
- Die Browser-Entwicklung selbst startet als eigenes Repo (Arbeitstitel `../browse`),
  analog zu `../all-backed`.
- Beta-Ankündigung, Downloads und Release Notes erscheinen später auf der Landing Page.
