// browse handbook — content and rendering. Plain JS, no dependencies.
// Language defaults to the system language, the toggle persists per profile.

const CONTENT = {
  de: [
    {
      id: 'willkommen',
      title: 'Willkommen bei browse',
      html: `
        <p>browse ist ein Chromium-basierter Browser mit zwei Schwerpunkten:
        Privatsphäre ab Werk und volle Extension-Freiheit.</p>
        <p>Die Engine ist unverändertes Chromium — Websites funktionieren wie
        gewohnt. Geändert ist, was der Browser nebenher tut: nichts. Keine
        Telemetrie, keine Konten, keine Hintergrunddienste, die Daten an
        Dritte melden.</p>
        <div class="note">Dieses Handbuch beschreibt den aktuellen Stand.
        Es öffnet sich jederzeit über das Handbuch-Symbol in der
        Werkzeugleiste.</div>`,
    },
    {
      id: 'adblock',
      title: 'Werbeblocker ab Werk',
      html: `
        <p>browse kommt mit vorinstalliertem uBlock Origin — der vollen
        Version mit kompletten Filterlisten und kosmetischem Filtern, nicht
        der abgespeckten Lite-Variante.</p>
        <ul>
          <li>Blockt Werbung, Tracker und Malware-Domains ab dem ersten Start</li>
          <li>Konfigurierbar über das uBlock-Symbol in der Werkzeugleiste</li>
          <li>Pro Website abschaltbar, wenn eine Seite es braucht</li>
        </ul>`,
    },
    {
      id: 'mv2',
      title: 'Manifest V2 & Extensions',
      html: `
        <p>Chrome hat Manifest-V2-Extensions 2025 abgeschaltet — browse hält
        sie am Leben. Das ist die Grundlage dafür, dass uBlock Origin in der
        vollen Version läuft.</p>
        <ul>
          <li>MV2- und MV3-Extensions installieren und nutzen</li>
          <li>Bestehende Chrome-Extensions funktionieren unverändert</li>
        </ul>
        <div class="note">Geplant: Kompatibilität für Firefox-Add-ons.</div>`,
    },
    {
      id: 'fingerprint',
      title: 'Fingerprinting-Schutz',
      html: `
        <p>Fingerprinting erkennt Sie ohne Cookies wieder — über messbare
        Eigenheiten Ihres Geräts. browse schließt die drei wichtigsten
        Kanäle:</p>
        <ul>
          <li>Canvas — Pixel-Ausleseoperationen (<code>getImageData</code>,
          <code>toDataURL</code>, <code>toBlob</code>) erhalten ein feines
          Rauschen; das Bild bleibt gleich, die Signatur nicht</li>
          <li>WebAudio — Audio-Auslesewege bekommen dasselbe Prinzip</li>
          <li>Client-Hints — Details zu System und Browser werden nur noch
          auf ausdrückliche Anfrage der Website herausgegeben</li>
        </ul>
        <p>Der Schutz ist standardmäßig aktiv und lässt sich unter
        <code>chrome://flags/#fingerprinting-protection</code> abschalten,
        falls eine Website Probleme macht.</p>`,
    },
    {
      id: 'google',
      title: 'Suche & Google-Dienste',
      html: `
        <p>browse trennt die Verbindung zu Googles Hintergrunddiensten:</p>
        <ul>
          <li>Standardsuche ist DuckDuckGo — jede andere Suchmaschine bleibt
          in den Einstellungen wählbar</li>
          <li>Kein <code>X-Client-Data</code>-Header, keine Field-Trials,
          kein Cloud-Messaging, keine Übersetzungs-Anfragen im Hintergrund</li>
          <li>Phishing- und Malware-Schutz läuft über lokale Listen —
          besuchte Adressen werden nicht in Echtzeit an Google gemeldet</li>
        </ul>`,
    },
    {
      id: 'tabs',
      title: 'Schlafende Tabs',
      html: `
        <p>Inaktive Tabs legt browse nach einer Weile schlafen: Sie bleiben
        sichtbar, geben aber Arbeitsspeicher und CPU frei. Ein Klick weckt
        den Tab an exakt der Stelle, an der er war.</p>`,
    },
    {
      id: 'roadmap',
      title: 'Was noch kommt',
      html: `
        <ul>
          <li>Vertikale Tabs & Seitenleiste</li>
          <li>Workspaces — Tab-Gruppen für getrennte Kontexte</li>
          <li>Command Bar (Cmd/Ctrl+K)</li>
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
        <p>The engine is unmodified Chromium — websites work as usual. What
        changed is what the browser does on the side: nothing. No telemetry,
        no accounts, no background services reporting to third parties.</p>
        <div class="note">This handbook describes the current state. Reopen
        it anytime via the handbook icon in the toolbar.</div>`,
    },
    {
      id: 'adblock',
      title: 'Ad blocking out of the box',
      html: `
        <p>browse ships with uBlock Origin preinstalled — the full version
        with complete filter lists and cosmetic filtering, not the reduced
        Lite variant.</p>
        <ul>
          <li>Blocks ads, trackers and malware domains from the first launch</li>
          <li>Configurable via the uBlock icon in the toolbar</li>
          <li>Can be switched off per site when a page needs it</li>
        </ul>`,
    },
    {
      id: 'mv2',
      title: 'Manifest V2 & extensions',
      html: `
        <p>Chrome switched off Manifest V2 extensions in 2025 — browse keeps
        them alive. That is what makes the full uBlock Origin possible.</p>
        <ul>
          <li>Install and run both MV2 and MV3 extensions</li>
          <li>Existing Chrome extensions work unchanged</li>
        </ul>
        <div class="note">Planned: compatibility for Firefox add-ons.</div>`,
    },
    {
      id: 'fingerprint',
      title: 'Fingerprinting protection',
      html: `
        <p>Fingerprinting re-identifies you without cookies — via measurable
        quirks of your device. browse closes the three main channels:</p>
        <ul>
          <li>Canvas — pixel readouts (<code>getImageData</code>,
          <code>toDataURL</code>, <code>toBlob</code>) receive subtle noise;
          the image stays the same, the signature does not</li>
          <li>WebAudio — audio readouts get the same treatment</li>
          <li>Client hints — details about your system and browser are only
          handed out when a site explicitly asks</li>
        </ul>
        <p>Protection is on by default and can be disabled at
        <code>chrome://flags/#fingerprinting-protection</code> if a site
        misbehaves.</p>`,
    },
    {
      id: 'google',
      title: 'Search & Google services',
      html: `
        <p>browse cuts the line to Google’s background services:</p>
        <ul>
          <li>Default search is DuckDuckGo — any other engine remains
          selectable in Settings</li>
          <li>No <code>X-Client-Data</code> header, no field trials, no
          cloud messaging, no background translate requests</li>
          <li>Phishing and malware protection runs on local lists — visited
          addresses are not reported to Google in real time</li>
        </ul>`,
    },
    {
      id: 'tabs',
      title: 'Sleeping tabs',
      html: `
        <p>browse puts inactive tabs to sleep after a while: they stay
        visible but release memory and CPU. One click wakes a tab exactly
        where it left off.</p>`,
    },
    {
      id: 'roadmap',
      title: 'What’s coming',
      html: `
        <ul>
          <li>Vertical tabs & sidebar</li>
          <li>Workspaces — tab groups for separate contexts</li>
          <li>Command bar (Cmd/Ctrl+K)</li>
          <li>Split view — two pages side by side</li>
          <li>Firefox add-on compatibility</li>
        </ul>`,
    },
  ],
};

const LANG_KEY = 'browse.handbook.lang';

function currentLang() {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === 'de' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function render(lang) {
  const sections = CONTENT[lang];
  const toc = document.getElementById('toc');
  const main = document.getElementById('content');
  toc.innerHTML = '';
  main.innerHTML = '';
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
    body.innerHTML = s.html;
    sec.appendChild(body);
    main.appendChild(sec);
  }
  document.getElementById('lang-de').classList.toggle('active', lang === 'de');
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.documentElement.lang = lang;
}

document.getElementById('lang-de').addEventListener('click', () => {
  localStorage.setItem(LANG_KEY, 'de');
  render('de');
});
document.getElementById('lang-en').addEventListener('click', () => {
  localStorage.setItem(LANG_KEY, 'en');
  render('en');
});

render(currentLang());
