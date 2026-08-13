# Build-Runner-Entscheidung (Phase 0, Punkt 10)

Anforderung: kompletter Chromium-Build = ~200 GB Disk, 32–64 GB RAM, Build-Zeit
skaliert mit Kernen (16 K ≈ 5 h, 32 K ≈ 2,5 h, 64 K ≈ 1,5 h). Erwartete Frequenz
anfangs 2–10 Voll-Builds/Monat (Upstream-Bumps + Patch-Arbeit), inkrementelle
Builds dazwischen. Recherche-Stand: 2026-08-13 (Preise netto).

## Optionen für Linux/Windows-Builds

| Option | Kosten pro Voll-Build | Fixkosten | Betrieb | Anmerkungen |
| --- | --- | --- | --- | --- |
| **A. Hetzner Cloud CCX63 on-demand** (48 vCPU, 188 GB RAM, 960 GB NVMe) | **~€2–4** (€1,37/h, 1,5–3 h) | ~€0 (Snapshot-Speicher wenige €) | Lifecycle-Skript nötig (hcloud CLI: erzeugen → als GitHub-Runner registrieren → bauen → löschen) | Günstigste Compute-Option; Checkout via Snapshot cachen, sonst kostet jeder Lauf +1 h Sync |
| B. GitHub larger runner, Linux 32 K (128 GB RAM, 1,2 TB Disk) | ~€11–14 ($0,082/min) | GitHub-Team-Plan nötig ($4/User/Monat) | null — zero-ops | Windows analog ~€25–29/Build ($0,162/min) |
| C. Hetzner dedicated AX102 (7950X3D 16 K/32 T, 128 GB, 2×1,9 TB NVMe) | ~€0 marginal | **€259/Monat + €129 Setup** | Server pflegen, Runner warm halten | Lohnt erst bei täglichen Builds oder als kombinierte Dev-/Cache-Box; Auktion ggf. günstiger, Bestand volatil |

Windows-Anmerkung: Windows-Builds laufen auf Windows-Runnern (GitHub Option B)
oder auf dem Hetzner-Server mit Windows-Lizenz; Cross-Build von Linux aus ist
extern fummelig (SDK-Packaging) — erst später bewerten.

## Optionen für macOS-arm64-Builds

| Option | Bewertung |
| --- | --- |
| GitHub-hosted macOS (alle Größen) | ❌ **14 GB Disk, kategorisch ungeeignet** |
| AWS EC2 Mac | ❌ 24-h-Mindestbelegung ≈ $37+ pro Aktivierung |
| MacStadium Mac mini M4 | ab $119/Monat, 16 GB RAM knapp |
| **Vorhandener M1 Max (10 K, 64 GB RAM) als self-hosted Runner** | ✅ beste Option — Hardware ist da und stärker als ein Miet-mini. Blocker: nur 108 GB intern frei (~200 GB nötig) und volles Xcode fehlt. Lösung: ~120 GB freiräumen **oder** dedizierte externe TB/USB4-NVMe-SSD (2 TB ≈ €130–180; nicht das Time-Machine-Laufwerk) |

Self-hosted GitHub-Runner sind gebührenfrei; dokumentierte Praxis (Clutch
Engineering) spart mit eigenen M-Series-Maschinen >$4.000/Monat ggü. Cloud-Macs.

## Was vergleichbare Forks tun

Helium und ungoogled-chromium bauen auf gesponserten Runnern (Depot);
ungoogled-macOS ist dadurch bei Intel-Builds aktuell blockiert. Cromite-Umfeld
nutzt selbst gehostete Runner auf eigenen VPS. Ein eigenes RBE-/Siso-Remote-
Cluster betreibt keiner der kleinen Forks — bei unserer Frequenz lohnt der
Aufwand nicht (Erkenntnis: rohe Kernzahl schlägt Cache-Infrastruktur bei
seltenen Voll-Builds).

## Empfehlung

1. **Linux (erster voller Build + CI): Option A — CCX63 on-demand.**
   Chromiums bestunterstützte Plattform, validiert Args + Patchset am
   schnellsten; ~€2–4 pro Build statt €259/Monat Fixkosten. Das
   Lifecycle-Skript wird Teil des Repos und ist später der `chromium-builder`.
   Fallback bei Ops-Unlust: Option B (Team-Plan + 32-K-Runner).
2. **macOS: vorhandenen M1 Max als self-hosted Runner** nutzen, sobald Disk
   gelöst ist (externe NVMe-SSD empfohlen, entkoppelt Build vom Systemvolume).
3. **Windows: zurückstellen** bis Linux+macOS stehen; dann GitHub
   Windows-Runner (~€25–29/Build) oder Windows auf dem Builder-Server.
4. Dedicated Server (Option C) erst neu bewerten, wenn Build-Frequenz
   dauerhaft ≥ ~1/Tag liegt.

**Status: entschieden (2026-08-13, Inhaber):**

- **Linux: Option A** — CCX63 on-demand. Automatisierung: `scripts/cloud-build.sh`
  (Server erzeugen → bauen → Artefakt holen → Server löschen; optionaler
  Checkout-Snapshot als Cache, ~200 GB ≈ wenige €/Monat Speicherkosten).
- **macOS: M1 Max + dedizierte externe TB/USB4-NVMe-SSD** (2 TB, einmalig
  ~€130–180) als self-hosted Runner.
- **Windows: zurückgestellt**, Neubewertung wenn Linux + macOS stehen.

Nächste Schritte (Inhaber): (1) Hetzner-Cloud-Projekt anlegen und API-Token
(Lesen+Schreiben) erzeugen → als `HCLOUD_TOKEN` bereitstellen; (2) externe
NVMe-SSD beschaffen. Erster Lauf von `cloud-build.sh` bitte beaufsichtigt.
