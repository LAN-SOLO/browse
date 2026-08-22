# browse handbook (Komponenten-Extension)

Das eingebaute Benutzerhandbuch von browse: eine minimale MV3-Extension ohne
Dependencies. Der Werkzeugleisten-Knopf öffnet `handbook.html` — DE/EN,
Terminal-Look passend zur Tool-Familie, Inhalt in `handbook.js` (`CONTENT`).

## Warum eine Extension?

Kein Chromium-Patch, kein Rebuild: Die Extension wird wie uBlock über den
External-Extensions-Mechanismus (Patch 005) vorinstalliert und lässt sich
unabhängig vom Browser-Build aktualisieren.

## Packen & Bundeln

```
scripts/pack-handbook.sh [chromium-binary]
```

erzeugt `extensions/prebuilt/handbook.crx` + `<id>.json`; der Signierschlüssel
liegt außerhalb des Repos unter `~/.browse/handbook.pem` (bestimmt die
Extension-ID — nicht verlieren, nicht einchecken). `stage-extensions.sh`
bündelt danach alles Vorgepackte automatisch in die App.

## Inhalt pflegen

Bei jedem Feature-Patch, der Nutzersichtbares ändert, die betroffene Sektion
in `handbook.js` in BEIDEN Sprachen nachziehen und die Version in
`manifest.json` anheben.
