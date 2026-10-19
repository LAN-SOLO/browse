# browse — Audit 1.0

browse war in Runde 1 nicht dabei; dieses Dokument beginnt deshalb direkt mit
Runde 2.

## Runde 2 (2026-10-20)

**Basis:** `8de564d` (main). **Art:** reines Review, ohne Chromium-Build (es gibt
lokal keinen Build, der Checkout liegt auf einer nicht eingehängten
Platte). Geprüft wurden `patches/*.patch` + `series`, `scripts/`, `config/`,
`extensions/` (Handbuch-Extension, in echtem Headless-Chromium getestet),
`monitor/` (lokal, nicht in git) und die CI. Der Chromium-Checkout wurde nicht
angefasst.

„Getestet“ heißt hier: wirklich ausgeführt. Alles zu den Engine-Patches ist
Code-Review und braucht einen Build, um bestätigt oder widerlegt zu werden.

### Behoben (ohne Build prüfbar)

| # | Befund | Fix | Nachweis |
| --- | --- | --- | --- |
| F1 | **Der Symlink `chromium` war eingecheckt** (Ziel `/Volumes/browse500GBdev/chromium`, die verschollene Platte). `.gitignore` hatte `/chromium/`, das passt nur auf Verzeichnisse. Jeder frische Clone (cloud-build.sh, CI-Build-Job) bekam einen toten Link, `mkdir -p chromium` in `fetch-chromium.sh` brach sofort ab. | Link aus dem Index entfernt (lokaler Link bleibt), `.gitignore` auf `/chromium`; `fetch-chromium.sh` meldet einen toten Link verständlich. | `git check-ignore` greift; `mkdir -p` auf toten Link reproduziert (`No such file or directory`). |
| F2 | **`apply-patches.sh` war bei Wiederholung nicht idempotent:** 012 schreibt Zeilen um, die 011 eingeführt hat. Danach lässt sich 011 nicht mehr allein rückwärts prüfen, das Skript wendet es erneut an, und es gibt einen Konflikt. Das trifft jeden zweiten Lauf auf einem schon gepatchten Checkout, z. B. den Snapshot-Cache in `cloud-build.sh`. Außerdem ging die letzte `series`-Zeile ohne Zeilenumbruch verloren. | Stamp-Datei `.git/browse-patches.stamp` (Patch-Name + sha256 + Fingerabdruck aller berührten Dateien). Stimmt der Fingerabdruck nicht mehr, gilt wieder die alte Rückwärtsprüfung. Bei einem Konflikt steht jetzt ein klarer Hinweis da. | Neuer Selbsttest `scripts/test-apply-patches.sh` (frisch → Wiederholung → Handänderung → fehlender Zeilenumbruch), auch in CI. Mit dem alten Skript nachgestellt: zweiter Lauf → `with conflicts`. |
| F3 | `cloud-build.sh`: Der EXIT-Trap wurde erst **nach** `server create` + `server ip` gesetzt. Schlug `ip` fehl, lief ein bezahlter CCX63 einfach weiter. Hetzner vergibt IPs neu, ein alter `known_hosts`-Eintrag ließ `accept-new` den Lauf abbrechen und hat `~/.ssh/known_hosts` mit Wegwerf-Servern gefüllt. Gebaut wurde `origin/main` statt des lokalen Stands. | Trap vor dem Anlegen, Cleanup prüft, ob der Server existiert. Eigene `known_hosts`-Datei pro Lauf. Der Server checkt exakt den lokalen `HEAD` aus, mit Warnung, wenn der noch nicht gepusht ist. | `shellcheck`, `bash -n`. Ein echter Lauf kostet Geld und wurde nicht gemacht. |
| F4 | `pack-handbook.sh`: Der private Signierschlüssel entstand mit Standard-umask (0644). Chromium überschreibt eine vorhandene `handbook.crx` nicht und endet trotzdem mit Code 0, dann wurde die **alte** CRX ausgeliefert. | `umask 077`, `chmod 600/700`, alte CRX vorher löschen, Erfolg an der Datei prüfen. | Mit Chrome for Testing gepackt (Test-HOME): Schlüssel `-rw-------`, CRX + `<id>.json` erzeugt. Testartefakte wieder gelöscht. |
| F5 | `dev-shell.sh`: `npx --yes @puppeteer/browsers` lief ohne Version, also wurde bei jedem Erst-Setup und in CI das jeweils neueste npm-Paket ausgeführt. Der Kommentar „pinned snapshot“ stimmte nicht. | Installer auf `@puppeteer/browsers@2.13.2` gepinnt (lag schon im npx-Cache, keine neue Dependency). Snapshot per `BROWSE_DEV_CHROMIUM` wählbar. Ehrlicher Kommentar plus Hinweis auf den offenen DevTools-Port. | `dev-shell.sh --smoke` → PASSED (Chromium 153.0.8006.0). |
| F6 | `fetch-ubo.sh`: `curl` durfte Redirects auf http folgen. | `--proto '=https' --tlsv1.2` (die Checksumme schützte schon vorher, das ist Defense in Depth). | `shellcheck` |
| F7 | **Handbuch: jeder Klick öffnete einen weiteren Tab.** `chrome.tabs.query({url})` braucht die Berechtigung `tabs` und liefert ohne sie stumm `[]`. | `chrome.runtime.getContexts()` (ohne Berechtigung, vergleicht ohne `#anker`), Doppelklick-Sperre, Fehler werden geloggt statt verschluckt. | Alter Code im Headless-Chromium: `query` → 0 Treffer bei offenem Tab. Neuer Code: siehe T1. |
| F8 | **Handbuch-Inhalt stimmte nicht mit dem Verhalten überein (L12):** „Engine ist unverändertes Chromium“ (falsch, 010–013 ändern Blink); „kein Cloud-Messaging“ (GCM/Push bleibt bewusst); „keine Übersetzungs-Anfragen“ (nicht belegt); „schließt die drei wichtigsten Kanäle“ (WebGL, Schriften usw. bleiben offen); uBlock „ab dem ersten Start“ (nur in macOS-Builds, siehe B3); Handbuch „über das Symbol in der Werkzeugleiste“ (MV3-Actions sind standardmäßig nicht angepinnt). | Texte DE+EN korrigiert: neuer Abschnitt „Netzwerk & Google-Dienste“ mit dem, was bewusst aktiv bleibt; Lücken benannt; Plattformstand bei uBlock genannt; Safe-Browsing-Stand über `chrome://safe-browsing` prüfbar. | T1 |
| F9 | Handbuch L6: „Cmd/Ctrl+K“ war hartkodiert. | Je Plattform: `⌘K` (macOS), `Strg+K` (DE), `Ctrl+K` (EN). | T1 (Mac- und Windows-UA emuliert) |
| F10 | Handbuch L12: Manifest-Name, Beschreibung und Button-Titel waren gemischt zweisprachig. Tab-Titel und `handbook`-Label waren immer englisch. | `_locales/de` + `_locales/en` (`default_locale: en`), Titel und Label wechseln mit der Sprache, `aria-pressed` an den Sprach-Buttons. | T1 |
| F11 | Handbuch: Bei blockiertem `localStorage` warf das Skript, und die Seite blieb leer. | `try/catch` um Lesen und Schreiben. | T1 (Storage wirft) |
| F12 | Handbuch L7: keine explizite CSP. | `extension_pages`: `default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`. `minimum_chrome_version: 116` (`getContexts`). | T1: keine CSP-/Konsolen-Fehler |
| F13 | `monitor/` (lokal, nicht in git): **CSRF.** Jede Webseite im Browser konnte per `fetch('http://127.0.0.1:3052/api/pause',{method:'POST',mode:'no-cors'})` Builds abbrechen und die Platte auswerfen. Per DNS-Rebinding ließ sich der Status mitlesen. SSD-Pfad noch fest auf die alte Platte. | Prüfung von Host und Origin, POST nur mit eigenem Header (erzwingt einen Preflight, den der Server nie beantwortet). SSD = Ziel des `chromium`-Symlinks (`BROWSE_SSD` überschreibt). | Mit curl gegen eine Testinstanz: fremder Host → 403, POST ohne Header → 403, fremder Origin → 403, Status → 200. Weil `monitor/` gitignored ist, gehört der Fix nicht zum Commit. Der launchd-Agent war nicht geladen, deshalb kein Neustart. |

**T1 — `scripts/test-handbook.mjs`** (neu, auch in CI): echter Headless-Chromium.
Geprüft wird: Öffnen zweimal nacheinander, nach einem `#anker`-Sprung, parallel
und nach dem Schließen ergibt immer genau einen Tab. Manifest-Strings kommen
über `_locales`. Der Erststart folgt `navigator.language` (de-DE → DE, en-US →
EN). Für DE/EN × hell/dunkel × 1280 px/360 px: 8 Abschnitte, keine
Platzhalter, kein horizontaler Überlauf, richtige Palette, kein Text der
anderen Sprache. Dazu das Shortcut-Label für Mac und Windows, das Rendern mit
blockiertem Storage und keine Exceptions. Ergebnis: **alle Checks grün** mit
Chrome for Testing (chromium-1217) und mit dem Dev-Shell-Snapshot
153.0.8006.0. Dazu kamen Screenshots bei 360 px und 1280 px zur Sichtprüfung
(Terminal-Stil unverändert).

### Offene Befunde (brauchen einen Build oder eine Entscheidung)

Schwere: **Blocker** = so nicht als 1.0 ausliefern; Hoch; Mittel; Niedrig.

- **B1 — Blocker: kein Update-Weg (L13).** `package.sh` ist ein Stub, es gibt
  weder Updater noch Update-Feed. Gepinnt ist Chromium 152.0.7977.42 (August
  2026); heute, im Oktober 2026, ist das schon mehrere Stable-Sicherheits-Releases
  alt. Ohne Updater bekommen Nutzer keine Chromium-Sicherheitsfixes, uBlock
  (externe CRX) bleibt auf 1.73.0. Für 1.0: auf aktuelles Stable rebasen,
  Updater + signierter Feed (`updates.lan-solo.com/browse/`) und eine
  Versionsprüfung, die mit `1.0.0` umgehen kann.
- **B2 — Blocker: keine Signatur/Notarisierung.** `MAC_TEAM_ID` ist leer,
  `package.sh` ist ein Stub. Patch 005 begründet den Verzicht auf den
  Extension-Prompt aber mit Code-Signing.
- **B3 — Hoch (Windows/Linux): uBlock und Handbuch sind dort nicht
  vorinstalliert.** `build.sh` staged Extensions nur für `mac`. Patch 005
  lässt unter Windows den Upstream-Prompt bewusst stehen (die Extension käme
  deaktiviert mit Rückfrage), und Windows-Chromium akzeptiert externe
  CRX-Dateien aus dem Programmverzeichnis vermutlich gar nicht. Das
  Linux-Tarball in `cloud-build.sh` enthält keinen `extensions/`-Ordner.
  Dokumentiert, Handbuch-Text nennt den Stand. Nur mit Windows-/Linux-Build
  lösbar.
- **B4 — Hoch: `config/initial_preferences.json` und
  `config/policies/managed/browse-defaults.json` kommen nie in ein Build.**
  Nur `dev-shell.sh` kopiert die Prefs ins Dev-Profil (dort werden die
  `distribution`-Schlüssel ignoriert). Folge in echten Builds wahrscheinlich:
  HTTPS-Only aus, Suchvorschläge an (gehen an DDG), Übersetzen an,
  Passwort-Dienst an, DNT aus. Die Policies (JSON) würden ohnehin nur unter
  Linux aus `/etc/…/policies` gelesen, unter macOS/Windows braucht es plist
  bzw. Registry. Am Build prüfen (`chrome://prefs-internals`,
  `chrome://policy`), dann als Prefs-Default-Patch (wie 004) oder als
  `initial_preferences` neben dem Binary ausliefern.
- **B5 — Hoch: Safe Browsing ohne API-Key.** `google_api_key = ""`. Die
  Safe-Browsing-Listen-Updates brauchen den Key, also ist es gut möglich, dass
  „Standardschutz“ im UI aktiv aussieht, aber gar nichts prüft. 007 schaltet
  zusätzlich die Echtzeit-Abfragen ab. Am Build prüfen: `chrome://safe-browsing`
  (Datenbank-Stand) und `testsafebrowsing.appspot.com`. Per `--log-net-log`
  zusätzlich prüfen, ob Download-Pings (`ClientDownloadRequest`) trotzdem an
  Google gehen.
- **B6 — Mittel–Hoch: Patch 005 schaltet den Extension-Prompt unter macOS
  global ab.** Das gilt nicht nur für das Bundle-Verzeichnis, sondern auch für
  das Benutzerverzeichnis `~/Library/Application Support/browse/External
  Extensions`. Jeder Prozess, der als Nutzer läuft (Adware), kann dann still
  eine Extension installieren, genau das Szenario, gegen das Upstream schützt.
  Vorschlag: Prompt nur für die gebündelten IDs (uBlock, Handbuch) bzw. nur für
  den Bundle-Pfad überspringen. Code-Signing prüft Gatekeeper nur beim ersten
  Start, nicht zur Laufzeit.
- **B7 — Mittel: Canvas-Rauschen (011/012) lässt sich umgehen.**
  (a) Das Muster ist an die Ecke des Leserechtecks gebunden, nicht an
  Canvas-Koordinaten. `getImageData(x,y,1,1)` testet bei jedem Aufruf dieselbe
  erste Zufallszahl, bei ~7/8 der Origins gibt es also **gar kein**
  Rauschen. Mit verschobenen Rechtecken lässt sich per Mehrheitsentscheid das
  saubere Bild rekonstruieren (der Kommentar „can't be voted out“ trifft nicht
  zu). (b) Das Rauschen hängt nicht vom Inhalt ab: Eine einfarbige
  Kalibrierfläche gleicher Größe liefert die Maske, die sich dann abziehen
  lässt. (c) Der Schlüssel ist die **aufrufende** Origin, nicht die Top-Level-Site.
  Ein Fingerprinting-iframe derselben Drittanbieter-Origin bekommt auf jeder
  Website dasselbe Muster (solange der Renderer-Prozess wiederverwendet wird).
  Damit ist es seitenübergreifend verknüpfbar. (d) Das Salt gilt pro
  **Renderer-Prozess**, nicht pro Browser-Sitzung. (e) Opake Origins teilen
  sich `"null"`. (f) Nicht abgedeckt sind WebGL-`readPixels`, WebGPU,
  `measureText`/Schriften. Vorschlag: Seed aus Top-Level-eTLD+1 + Origin +
  absoluter Pixelkoordinate, Salt im Browser-Prozess pro Sitzung, an den
  Renderer übergeben.
- **B8 — Mittel: Audio-Rauschen (013).** Ebenfalls inhaltsunabhängig: Ein
  Nullpuffer liefert die Maske. `AudioWorklet`- und `AnalyserNode`-Pfade sind
  nicht abgedeckt, das klassische Rezept funktioniert über einen Worklet ohne
  Rauschen.
- **B9 — Niedrig–Mittel: 010** entfernt die `Sec-CH-UA*`-Header, aber
  `navigator.userAgentData` bleibt bestehen. Das Fehlen der Header ist selbst
  ein seltenes Merkmal und kann Logins oder Bot-Erkennung brechen (Google-Login
  testen).
- **B10 — Mittel: 007.** Das Einstellungs-UI bietet weiter „Erweiterter
  Schutz“ mit dem Versprechen von Echtzeit-Prüfungen, die nie stattfinden.
  Option ausblenden oder Text anpassen.
- **B11 — Info: 002** ignoriert auch die Admin-Policy
  `ExtensionManifestV2Availability = 1` (MV2 aus). Admins können MV2 nicht
  mehr abschalten, das gehört in die Doku.
- **B12 — Info:** Die Widevine-CDM-Komponente und GCM/Push sind bewusste
  Verbindungen zu Google. Das Handbuch nennt sie jetzt.
- **B13 — Info:** Das Handbuch ist nie gepackt worden (`~/.browse/handbook.pem`
  existiert nicht, keine `handbook.crx` in `prebuilt/`). Im Build ist es also
  noch nicht enthalten. Auf dem Mac mit dem gebauten Binary
  `pack-handbook.sh` laufen lassen und Schlüssel sichern, er bestimmt die ID.
- **B14 — Info: Windows-Build-Pfad nie ausgeführt.** `build.sh` unter
  MSYS/Git-Bash, depot_tools-Toolchain (`DEPOT_TOOLS_WIN_TOOLCHAIN`), kein
  Staging, kein Installer.

### Sweep L1–L13

| | Ergebnis für browse |
| --- | --- |
| L1 | Kein Tauri, keine confirm/alert-Stubs. Handbuch hat keine Dialoge. Monitor nutzt `confirm` im normalen Browser (funktioniert). |
| L2 | Kein Backend; Manifest-Strings jetzt per `_locales` (F10). |
| L3 | Handbuch: `navigator.languages[0]`/`navigator.language` als Fallback, getestet (T1). |
| L4 | Kein CSV/JSON-Import/Export. |
| L5 | Skripte: Pfade mit Leerzeichen sind korrekt gequotet (das Repo liegt selbst unter „Cursor Projekts“; `pack-handbook`, `dev-shell` und `test-handbook` liefen dort). Windows-Dateisystem nur über einen Windows-Build prüfbar (B14). |
| L6 | Behoben (F9). |
| L7 | Handbuch: nur gebündelter statischer Inhalt, strikte CSP (F12), keine `web_accessible_resources`. |
| L8 | Keine Hauptthread-Lasten (Handbuch rendert 8 statische Abschnitte). |
| L9 | Handbuch-Öffnen parallel/nach dem Schließen ist sicher (F7, T1). `cloud-build`: Abbruch mitten im Lauf löscht den Server (F3). |
| L10 | Keine Zeitstempel-Logik. |
| L11 | `apply-patches` meldet Konflikte mit Hinweis statt nur mit Exit-Code. Handbuch-Fehler werden geloggt. Monitor-Pause hat einen Bestätigungsdialog. |
| L12 | Behoben (F8, F10). |
| L13 | Kein Updater, **Blocker B1**. |

`cargo audit` / Windows-Typecheck: entfallen (browse hat keinen Rust-/Tauri-Code;
die Engine ist Chromium, siehe B1/B14).

### Nur auf echter Hardware / mit Build prüfbar

1. macOS-Build (arm64 + x64): frisches Profil, uBlock (voll, MV2) aktiv ohne
   Prompt; Handbuch nach `pack-handbook.sh` + Rebuild vorinstalliert, über das
   Puzzle-Menü erreichbar, DE/EN je nach Systemsprache (`_locales`), hell und
   dunkel.
2. B4: `chrome://prefs-internals` und `chrome://policy` am Build: HTTPS-Only,
   Suchvorschläge, Übersetzen, Passwort-Dienst.
3. B5: `chrome://safe-browsing`, Testseite, Net-Log nach Google-Hosts
   (`safebrowsing`, `sb-ssl`, `clients2`).
4. B6: Eine JSON-Datei ins Benutzerverzeichnis `External Extensions` legen.
   Installiert browse die Extension ohne Rückfrage?
5. B7/B8: Bypass-Skripte (1×1-Lesen, verschobene Rechtecke, Kalibrierfläche,
   Drittanbieter-iframe auf zwei Sites, AudioWorklet) gegen den Build laufen
   lassen.
6. Windows (x64): Build überhaupt durchführen. Danach Extension-Staging,
   Prompt-Verhalten, Shortcut-Labels in der Browser-UI (Strg auf deutschem
   Windows), Widevine (ohne Lizenz erwartbar aus).
7. Ein echter `cloud-build.sh`-Lauf (kostet Geld) inklusive Snapshot-Wiederlauf
   (F2 in der Praxis).

## Runde 2 – Verifikation (2026-10-20)

**Basis:** `5a2eeee` (Runde-2-Commit), Diff `8de564d..5a2eeee` unabhängig
gegengeprüft. Wieder ohne Chromium-Build (`./chromium` zeigt auf
`/Volumes/Prod500GB`, die Platte ist nicht eingehängt). Ziel war, die
Aussagen aus Runde 2 zu widerlegen.

### Bestätigt (selbst ausgeführt)

- `scripts/test-apply-patches.sh`: grün mit Homebrew-bash 5.3 **und** mit
  macOS-`/bin/bash` 3.2 sowie mit `PATH=/usr/bin:/bin`.
- `scripts/test-handbook.mjs`: grün mit Chrome for Testing (chromium-1217) und
  dem Dev-Shell-Snapshot (`mac_arm-1678667`), je mehrfach, auch nach den
  Textänderungen unten (76 Prüfungen).
- `pack-handbook.sh` mit Chrome for Testing und temporärem `HOME`: Schlüssel
  `0600` in einem `0700`-Ordner, zweiter Lauf überschreibt die CRX korrekt.
  Der echte `~/.browse/handbook.pem` wurde **nicht** angelegt; die Test-CRX
  wurde wieder entfernt.
- `stage-extensions.sh` gegen ein Dummy-Bundle; `shellcheck scripts/*.sh` sauber.
- Monitor (lokal): Host-/Origin-/Header-Prüfung gelesen; `https://`- und
  `null`-Origins werden ebenfalls abgewiesen, Preflight wird nicht beantwortet.
- EXIT-Trap von `cloud-build.sh` läuft auch bei SIGINT/SIGTERM/SIGHUP
  (mit bash nachgestellt). Ein echter Hetzner-Lauf wurde nicht gemacht.

### Zusätzlich behoben

| # | Befund | Fix | Nachweis |
| --- | --- | --- | --- |
| V1 | `test-handbook.mjs` schlug beim ersten Lauf fehl („service worker not found“): zufälliger fester DevTools-Port 9400–9799, bei parallelen Läufen oder offener Dev-Shell landete der Test in einem **fremden** Browser. In CI wäre das ein Flake gewesen. | `--remote-debugging-port=0` + Port aus `DevToolsActivePort` des eigenen Profils; Wartezeit auf den Service Worker 10 s → 30 s. | 3× CfT + 2× Snapshot grün |
| V2 | `apply-patches.sh` brach unter macOS-`/bin/bash` 3.2 bei leerer Serie mit `APPLIED[@]: unbound variable` ab (`set -u` + leeres Array). | `${APPLIED[@]+"${APPLIED[@]}"}`. | nachgestellt und behoben |
| V3 | `apply-patches.sh` brauchte `shasum` (Perl), auf minimalen Linux-Images (Cloud-Server, Runner) nicht garantiert. | `sha256sum` bevorzugt, `shasum` als Rückfall. | Self-Test grün, auch mit reduziertem `PATH` |
| V4 | Lokal gepackte CRX-Dateien sind `0600` (Chromium schreibt sie so, `extensions/prebuilt/ublock.crx` ist es lokal auch), `cp` behält das. Im App-Bundle konnten andere macOS-Benutzerkonten die vorinstallierten Extensions damit nicht lesen. | `pack-handbook.sh` setzt `0644`; `stage-extensions.sh` macht alle gestagten `*.json`/`*.crx` lesbar. | Dummy-Bundle: `-rw-r--r--` |
| V5 | `pack-handbook.sh` lief mit dem Standardprofil: Läuft schon eine Instanz, übernimmt sie den Befehl, es entsteht keine CRX. Seit F4 bricht das Skript dann zwar ab, aber ohne Grund. | Eigenes Wegwerf-Profil (`--user-data-dir`, per Trap gelöscht). | Lauf mit CfT |
| V6 | L12: Handbuch „Fingerprinting“. „Je Website verschieden“ stimmt nicht: Das Muster hängt am Origin des aufrufenden Frames (B7), Drittanbieter-Frames können seitenübergreifend dasselbe Muster sehen. Außerdem stand da, „der Schutz“ lasse sich per Flag abschalten. Das Flag (014) schaltet aber nur Canvas- und Audio-Rauschen, nicht die Client-Hints (010). | DE+EN neu formuliert: „je Herkunft (Origin)“, Frame-Hinweis, Flag-Umfang genau benannt. Handbuch-Version bleibt 0.1.0: es wurde nie gepackt (B13), kein Bump nötig. | E2E grün (keine Fremdsprache, keine Platzhalter) |
| V7 | `cloud-build.sh` warnte nicht bei uncommitteten Änderungen. Der Server baut nur den Commit, lokale Edits fehlen also stillschweigend. | Warnung, wenn `git diff HEAD` nicht leer ist. | `bash -n`, shellcheck |

### Nicht widerlegt, aber präzisiert

- Stamp-Logik (F2): Ein aus der Serie **entfernter** Patch bleibt im Checkout
  angewendet und fließt nicht in den Fingerabdruck ein (war vorher genauso).
  Wer einen Patch aus `series` streicht, muss die betroffenen Dateien selbst
  zurücksetzen.
- Ändert sich der Inhalt eines schon angewendeten Patches (neue sha256), wird
  er auf den alten Stand angewendet und läuft in den Konflikt-Hinweis. Das ist
  so beabsichtigt, ein automatisches Zurückrollen gibt es nicht.
- Der Testhaken `globalThis.browseHandbook` steht auch im ausgelieferten
  Service Worker. Er ist nur im eigenen Extension-Kontext erreichbar und daher
  unkritisch.
- Salz pro Renderer-Prozess (011): Dasselbe Origin kann in zwei Prozessen
  verschiedene Muster bekommen. Eine Seite kann das Rauschen dadurch erkennen
  (ergänzt B7).

### L1–L13, Stichproben außerhalb von Runde 2

L5: `stage-extensions.sh`, `build.sh` und `fetch-chromium.sh` quoten Pfade mit
Leerzeichen korrekt. Das Windows-Staging fehlt weiterhin (B3). L9:
`pack-handbook` mit laufender Browser-Instanz (V5); paralleler Testlauf (V1).
L11: `stage-extensions`-Fehler in `build.sh` wird nur als Warnung gemeldet, der
Build läuft weiter. Das ist bewusst so, ein Release darf damit aber nicht
entstehen (gehört zu B2/package.sh). L12: V6. L13: weiterhin Blocker B1.
`cargo audit`/Windows-Typecheck: entfallen (kein Rust).

### Weiterhin nur mit Build / echter Hardware prüfbar

Unverändert die Liste aus Runde 2. Dazu kommt V4: an einem echten Bundle mit
zweitem macOS-Benutzerkonto prüfen, dass uBlock und das Handbuch dort
installiert werden.
