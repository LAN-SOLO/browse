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

Planungsphase — noch kein Code. Nächster Schritt laut Roadmap (Phase 0):
Build-/Merge-Pipeline für Chromium (CI für alle drei Plattformen), Branding,
Telemetrie-Entfernung, Defaults, uBlock Origin gebündelt, MV2 keep-alive.

## Verwandte Repositories

- [webpage](https://github.com/LAN-SOLO/webpage) — lan-solo.com inkl. Landing Page (`/[lang]/tools/browse/`)
- [all-backed](https://github.com/LAN-SOLO/all-backed) — Backup-Extension, in browse privilegiert integriert
- [secrets](https://github.com/LAN-SOLO/secrets) — Zero-Knowledge-Secret-Sharing
