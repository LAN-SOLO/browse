# Patch-Overlay

browse hält den Patchset gegen Chromium bewusst minimal (Helium-Lehre: jeder
Engine-Patch verteuert jeden Upstream-Merge). Patches liegen hier als
`NNN-kurzname.patch` und werden von `scripts/apply-patches.sh` in der
Reihenfolge aus `series` mit `git apply --3way` auf den Chromium-Checkout
angewendet.

Regeln:

1. **UI vor Engine.** Was sich über GN-Args, Policies, Preferences oder
   Komponenten-Extensions lösen lässt, wird NICHT gepatcht.
2. Ein Patch = ein Thema, mit Header-Kommentar (Warum + Upstream-Bezug).
3. Nach jedem Versions-Bump: `apply-patches.sh` muss sauber durchlaufen;
   Konflikte sofort auflösen, nie liegen lassen.

Geplante erste Patches (Reihenfolge = Priorität):

- `001-branding.patch` — Produktname, Verzeichnisse, Icons (config/branding/)
- `002-mv2-keepalive.patch` — Manifest-V2-Extensions dauerhaft lauffähig
  (Vorbild Brave). Belegt notwendig: Upstream M153 verweigert MV2 hart,
  Feature-Flags und die Policy `ExtensionManifestV2Availability` greifen
  nicht mehr (siehe `docs/PHASE-0.md`, Befunde)
- `003-anonymize-store-requests.patch` — Web-Store-Zugriffe ohne
  Google-Identifier (Helium-Vorbild)

`series` ist derzeit leer: Patches entstehen gegen den ersten vollständigen
Checkout (Phase 0, Schritt „fetch"), damit sie gegen echten Quellstand
formuliert sind statt blind.
