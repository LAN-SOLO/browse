// browse handbook — content and rendering. Plain JS, no dependencies.
// Language defaults to the browser language, the toggle persists per profile.
//
// Keep this text honest: describe what the current build really does, name
// gaps (platforms, uncovered APIs) instead of promising more. Placeholders:
// {{cmdk}} → platform shortcut label (⌘K on macOS, Strg+K / Ctrl+K elsewhere).

const CONTENT = {
  de: [
    {
      id: 'willkommen',
      title: 'Willkommen bei browse',
      html: `
        <p>browse ist ein Chromium-basierter Browser mit zwei Schwerpunkten:
        Privatsphäre ab Werk und volle Extension-Freiheit.</p>
        <p>Websites stellt die Chromium-Engine dar — sie funktionieren wie in
        Chrome. browse ändert vor allem, was der Browser nebenher tut: keine
        Telemetrie, kein Google-Konto, kein Abruf von Field-Trials. Welche
        Verbindungen trotzdem entstehen, steht unter
        <a href="#google">Netzwerk &amp; Google-Dienste</a>.</p>
        <div class="note">Dieses Handbuch beschreibt den aktuellen Stand. Es
        öffnet sich über das Erweiterungen-Symbol (Puzzleteil) in der
        Werkzeugleiste → <em>browse Handbuch</em>; dort lässt es sich auch
        anpinnen.</div>`,
    },
    {
      id: 'adblock',
      title: 'Werbeblocker ab Werk',
      html: `
        <p>browse bringt uBlock Origin mit — die volle Version mit
        kompletten Filterlisten und kosmetischem Filtern, nicht die
        abgespeckte Lite-Variante.</p>
        <ul>
          <li>Blockt Werbung, Tracker und Malware-Domains ab dem ersten Start</li>
          <li>Konfigurierbar über das uBlock-Symbol in der Werkzeugleiste</li>
          <li>Pro Website abschaltbar, wenn eine Seite es braucht</li>
          <li>Die Filterlisten aktualisiert uBlock selbst; die Erweiterung
          wird mit neuen browse-Versionen erneuert</li>
        </ul>
        <div class="note">Stand: in den macOS-Builds vorinstalliert. Unter
        Windows und Linux richtet browse uBlock Origin noch nicht
        automatisch ein.</div>`,
    },
    {
      id: 'mv2',
      title: 'Manifest V2 & Extensions',
      html: `
        <p>Chrome hat Manifest-V2-Extensions 2025 abgeschaltet — browse hält
        sie am Leben. Das ist die Grundlage dafür, dass uBlock Origin in der
        vollen Version läuft.</p>
        <ul>
          <li>MV2- und MV3-Extensions laufen nebeneinander</li>
          <li>Bestehende Chrome-Extensions funktionieren unverändert</li>
          <li>Ob der Chrome Web Store eine MV2-Extension noch anbietet,
          entscheidet Google; sonst lässt sie sich unter
          <code>chrome://extensions</code> im Entwicklermodus entpackt
          laden</li>
        </ul>
        <div class="note">Geplant: Kompatibilität für Firefox-Add-ons.</div>`,
    },
    {
      id: 'fingerprint',
      title: 'Fingerprinting-Schutz',
      html: `
        <p>Fingerprinting erkennt Sie ohne Cookies wieder — über messbare
        Eigenheiten Ihres Geräts. browse erschwert drei bekannte Kanäle:</p>
        <ul>
          <li>Canvas — Pixel-Ausleseoperationen (<code>getImageData</code>,
          <code>toDataURL</code>, <code>toBlob</code>) erhalten ein feines
          Rauschen, je Website verschieden und nach jedem Neustart neu; das
          Bild bleibt für das Auge gleich, die Signatur nicht</li>
          <li>WebAudio — ausgelesene Audio-Puffer
          (<code>getChannelData</code>, <code>copyFromChannel</code>)
          bekommen dasselbe Prinzip, unhörbar</li>
          <li>Client-Hints — die <code>Sec-CH-UA</code>-Header zu Browser und
          System sendet browse nur noch, wenn eine Website sie ausdrücklich
          anfordert</li>
        </ul>
        <p>Nicht abgedeckt sind unter anderem WebGL, installierte Schriften
        und Bildschirmmaße. Kein Browser verhindert Fingerprinting
        vollständig; uBlock Origin blockiert zusätzlich bekannte
        Fingerprinting-Skripte.</p>
        <p>Der Schutz ist standardmäßig aktiv und lässt sich unter
        <code>chrome://flags/#fingerprinting-protection</code> abschalten,
        falls eine Website Probleme macht.</p>`,
    },
    {
      id: 'google',
      title: 'Netzwerk & Google-Dienste',
      html: `
        <p>browse kappt die Hintergrund-Verbindungen, die Chromium sonst zu
        Google aufbaut:</p>
        <ul>
          <li>Standardsuche ist DuckDuckGo — jede andere Suchmaschine bleibt
          in den Einstellungen wählbar. Vorschläge beim Tippen gehen an die
          eingestellte Suchmaschine; abschaltbar in den Einstellungen
          (Suchbegriff „Autovervollständigung“)</li>
          <li>Kein <code>X-Client-Data</code>-Header, kein Abruf von
          Field-Trials, keine Domain-Reliability-Berichte</li>
          <li>Safe Browsing fragt besuchte Adressen nicht in Echtzeit bei
          Google ab; geprüft wird gegen lokal gespeicherte Listen. Ob diese Listen aktuell
          sind, zeigt <code>chrome://safe-browsing</code></li>
        </ul>
        <p>Bewusst aktiv bleiben:</p>
        <ul>
          <li>Der Komponenten-Updater — er lädt unter anderem das
          Widevine-Modul für DRM-Videos von Google nach</li>
          <li>Push-Nachrichten von Websites, denen Sie Benachrichtigungen
          erlaubt haben; sie laufen in Chromium über Googles Cloud
          Messaging</li>
        </ul>`,
    },
    {
      id: 'tabs',
      title: 'Schlafende Tabs',
      html: `
        <p>Inaktive Tabs legt browse nach einer Weile schlafen (Speicher
        sparen, ab Werk an): Sie bleiben in der Tableiste, geben aber
        Arbeitsspeicher frei. Beim Anklicken lädt der Tab neu. Einstellen
        lässt sich das unter <em>Einstellungen → Leistung</em>.</p>`,
    },
    {
      id: 'appearance',
      title: 'Hell & Dunkel',
      html: `
        <p>browse folgt dem Erscheinungsbild Ihres Systems: Ist macOS oder
        Windows auf Dunkel gestellt, sind Oberfläche und dieses Handbuch
        dunkel, sonst hell. Unter <em>Einstellungen → Darstellung → Modus</em>
        lässt sich der Modus unabhängig vom System fest auf Hell oder Dunkel
        setzen.</p>`,
    },
    {
      id: 'roadmap',
      title: 'Was noch kommt',
      html: `
        <ul>
          <li>Automatische Updates für browse selbst</li>
          <li>Vertikale Tabs &amp; Seitenleiste</li>
          <li>Workspaces — Tab-Gruppen für getrennte Kontexte</li>
          <li>Command Bar ({{cmdk}})</li>
          <li>Split View — zwei Seiten nebeneinander</li>
          <li>Firefox-Add-on-Kompatibilität</li>
        </ul>`,
    },
  ],
  en: [
    {
      id: 'willkommen',
      title: 'Welcome to browse',
      html: `
        <p>browse is a Chromium-based browser with two priorities: privacy by
        default and full extension freedom.</p>
        <p>Websites are rendered by the Chromium engine — they work as they
        do in Chrome. What browse changes is mostly what the browser does on
        the side: no telemetry, no Google account, no field-trial fetches.
        Which connections still happen is listed under
        <a href="#google">Network &amp; Google services</a>.</p>
        <div class="note">This handbook describes the current state. Open it
        via the extensions icon (puzzle piece) in the toolbar →
        <em>browse handbook</em>; you can pin it there as well.</div>`,
    },
    {
      id: 'adblock',
      title: 'Ad blocking out of the box',
      html: `
        <p>browse ships with uBlock Origin — the full version with complete
        filter lists and cosmetic filtering, not the reduced Lite
        variant.</p>
        <ul>
          <li>Blocks ads, trackers and malware domains from the first launch</li>
          <li>Configurable via the uBlock icon in the toolbar</li>
          <li>Can be switched off per site when a page needs it</li>
          <li>uBlock updates its filter lists itself; the extension is
          renewed with new browse versions</li>
        </ul>
        <div class="note">Status: preinstalled in the macOS builds. On Windows
        and Linux browse does not set up uBlock Origin automatically
        yet.</div>`,
    },
    {
      id: 'mv2',
      title: 'Manifest V2 & extensions',
      html: `
        <p>Chrome switched off Manifest V2 extensions in 2025 — browse keeps
        them alive. That is what makes the full uBlock Origin possible.</p>
        <ul>
          <li>MV2 and MV3 extensions run side by side</li>
          <li>Existing Chrome extensions work unchanged</li>
          <li>Whether the Chrome Web Store still offers an MV2 extension is
          up to Google; otherwise load it unpacked in developer mode under
          <code>chrome://extensions</code></li>
        </ul>
        <div class="note">Planned: compatibility for Firefox add-ons.</div>`,
    },
    {
      id: 'fingerprint',
      title: 'Fingerprinting protection',
      html: `
        <p>Fingerprinting re-identifies you without cookies — via measurable
        quirks of your device. browse makes three well-known channels
        harder to use:</p>
        <ul>
          <li>Canvas — pixel readouts (<code>getImageData</code>,
          <code>toDataURL</code>, <code>toBlob</code>) receive subtle noise,
          different per site and new after every restart; the image looks
          the same, the signature does not</li>
          <li>WebAudio — audio buffers read back
          (<code>getChannelData</code>, <code>copyFromChannel</code>) get the
          same treatment, inaudibly</li>
          <li>Client hints — browse only sends the <code>Sec-CH-UA</code>
          headers about your browser and system when a site explicitly asks
          for them</li>
        </ul>
        <p>Not covered are, among others, WebGL, installed fonts and screen
        metrics. No browser prevents fingerprinting completely; uBlock Origin
        additionally blocks known fingerprinting scripts.</p>
        <p>Protection is on by default and can be disabled at
        <code>chrome://flags/#fingerprinting-protection</code> if a site
        misbehaves.</p>`,
    },
    {
      id: 'google',
      title: 'Network & Google services',
      html: `
        <p>browse cuts the background connections Chromium otherwise opens
        to Google:</p>
        <ul>
          <li>Default search is DuckDuckGo — any other engine remains
          selectable in Settings. Suggestions while you type go to the
          selected search engine; you can switch them off in Settings
          (search for “autocomplete”)</li>
          <li>No <code>X-Client-Data</code> header, no field-trial fetches,
          no Domain Reliability reports</li>
          <li>Safe Browsing does not look up visited addresses with Google in
          real time; checks run against locally stored lists. Whether those lists are up
          to date is shown at <code>chrome://safe-browsing</code></li>
        </ul>
        <p>Deliberately kept:</p>
        <ul>
          <li>The component updater — among other things it downloads the
          Widevine module for DRM video from Google</li>
          <li>Push messages from sites you allowed to send notifications;
          in Chromium they run through Google’s Cloud Messaging</li>
        </ul>`,
    },
    {
      id: 'tabs',
      title: 'Sleeping tabs',
      html: `
        <p>browse puts inactive tabs to sleep after a while (Memory Saver, on
        by default): they stay in the tab strip but release memory. Clicking
        such a tab reloads it. Adjust this under
        <em>Settings → Performance</em>.</p>`,
    },
    {
      id: 'appearance',
      title: 'Light & dark',
      html: `
        <p>browse follows your system appearance: with macOS or Windows set
        to dark, the interface and this handbook are dark, otherwise light.
        Under <em>Settings → Appearance → Mode</em> you can pin the mode to
        light or dark independently of the system.</p>`,
    },
    {
      id: 'roadmap',
      title: 'What’s coming',
      html: `
        <ul>
          <li>Automatic updates for browse itself</li>
          <li>Vertical tabs &amp; sidebar</li>
          <li>Workspaces — tab groups for separate contexts</li>
          <li>Command bar ({{cmdk}})</li>
          <li>Split view — two pages side by side</li>
          <li>Firefox add-on compatibility</li>
        </ul>`,
    },
  ],
};

const UI = {
  de: { title: 'browse Handbuch', hb: 'handbuch', toc: 'Inhalt' },
  en: { title: 'browse handbook', hb: 'handbook', toc: 'Contents' },
};

const LANG_KEY = 'browse.handbook.lang';

// storage can be unavailable (blocked site data) — the handbook must still render
function storedLang() {
  try { return localStorage.getItem(LANG_KEY); } catch { return null; }
}
function storeLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* per-session only */ }
}

function currentLang() {
  const stored = storedLang();
  if (stored === 'de' || stored === 'en') return stored;
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  return nav.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function isMac() {
  const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  return /mac/i.test(p);
}

// ⌘K on macOS; German Windows/Linux keyboards label the key "Strg"
function shortcutLabel(lang) {
  if (isMac()) return '⌘K';
  return lang === 'de' ? 'Strg+K' : 'Ctrl+K';
}

function fill(html, lang) {
  return html.replaceAll('{{cmdk}}', shortcutLabel(lang));
}

function render(lang) {
  const sections = CONTENT[lang];
  const toc = document.getElementById('toc');
  const main = document.getElementById('content');
  toc.innerHTML = '';
  main.innerHTML = '';
  toc.setAttribute('aria-label', UI[lang].toc);
  for (const s of sections) {
    const a = document.createElement('a');
    a.href = `#${s.id}`;
    a.textContent = s.title;
    toc.appendChild(a);

    const sec = document.createElement('section');
    sec.id = s.id;
    const h = document.createElement('h2');
    h.textContent = s.title;
    sec.appendChild(h);
    const body = document.createElement('div');
    body.innerHTML = fill(s.html, lang); // static, bundled content only
    sec.appendChild(body);
    main.appendChild(sec);
  }
  for (const l of ['de', 'en']) {
    const btn = document.getElementById(`lang-${l}`);
    btn.classList.toggle('active', lang === l);
    btn.setAttribute('aria-pressed', String(lang === l));
  }
  document.documentElement.lang = lang;
  document.title = UI[lang].title;
  document.querySelector('.brand .hb').textContent = UI[lang].hb;
}

document.getElementById('lang-de').addEventListener('click', () => {
  storeLang('de');
  render('de');
});
document.getElementById('lang-en').addEventListener('click', () => {
  storeLang('en');
  render('en');
});

render(currentLang());
