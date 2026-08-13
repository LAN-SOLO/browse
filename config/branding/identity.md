# browse — Branding-Identität

Grundlage für den Branding-Patch (Phase 0 → Patchset) und die Installer.

| Feld | Wert |
| --- | --- |
| Produktname | `browse` (immer klein, mit Punkt in Marketing-Kontexten: „browse.") |
| Hersteller | LAN-SOLO UG |
| macOS Bundle-ID | `com.lan-solo.browse` |
| Windows AppUserModelId | `LAN-SOLO.browse` |
| Linux Desktop-ID / Paketname | `browse` (`browse.desktop`, Pakete `browse_*.deb` / `browse-*.rpm`) |
| User-Data-Verzeichnis | `browse` (statt `Chromium`) |
| Update-Feed | `https://updates.lan-solo.com/browse/` (nur Versionsnummer, siehe Plan §4.4) |
| Primärfarbe | `#0284c7` (primary-600 der Website), dunkel `#38bdf8` |
| Schrift Marketing | Mono-lastig wie lan-solo.com; UI folgt Plattformkonventionen |

Logo/Icon: eigenes Icon-Set noch offen (nicht das Website-Logo 1:1 übernehmen);
bis dahin Chromium-Standard-Icon im Prototyp. Kein Google-, Chrome- oder
Chromium-Branding in Releases (Markenrecht!) — der Branding-Patch ersetzt
Produktnamen und Icons vollständig.
