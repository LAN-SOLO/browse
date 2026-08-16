# Vorinstallierte Extensions

Was hier liegt, staged `scripts/stage-extensions.sh` nach jedem Build in das
App-Bundle unter `Contents/Resources/External Extensions/` (Pfad kommt aus
Patch 005, `chrome/common/chrome_paths.cc`). Chromium liest den Ordner beim
Start und installiert die referenzierten Extensions in ein frisches Profil —
so blockt browse Werbung ab Werk, ohne dass der Nutzer etwas laden muss.

## Inhalt

| Datei | Zweck |
| --- | --- |
| `ublock.crx` | uBlock Origin 1.73.0 (MV2), gepackt aus dem gepinnten Build (`extensions/ublock.lock`). Funktioniert nur dank Patch 002 (MV2 keep-alive). |
| `hkblfniembgdbfangcdjifbbhfohelgo.json` | External-Extensions-Manifest; Dateiname = Extension-ID (aus dem Packing-Key abgeleitet). Verweist per `external_crx` auf die CRX. |

## Neu packen (bei uBO-Version-Bump)

```bash
# uBO-Version in extensions/ublock.lock hochziehen, dann:
./scripts/fetch-ubo.sh
<gebautes browse.app>/Contents/MacOS/browse \
  --pack-extension=.cache/ublock/<ver>/uBlock0.chromium
# Ergebnis: uBlock0.chromium.crx + .pem. ID aus dem Public Key ableiten:
#   openssl rsa -in <pem> -pubout -outform DER | openssl dgst -sha256 -hex
#   erste 32 Hex-Zeichen, jede Ziffer 0-f → a-p = Extension-ID
# CRX hierher als ublock.crx, JSON in <id>.json umbenennen, external_version anpassen.
```

Hinweis: Der Packing-Key (`.pem`) wird bewusst NICHT eingecheckt. Ein neuer Key
ergibt eine neue ID — beim Bump einfach den JSON-Dateinamen mitziehen. External
CRX-Extensions aktualisieren sich nicht selbst; Updates kommen über einen
browse-Version-Bump.
