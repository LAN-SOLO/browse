// End-to-end test for the handbook extension (extensions/handbook/) in a real
// Chromium, headless, without a browse build:
//   - toolbar logic: repeated / concurrent opens focus ONE tab (also after an
//     in-page #anchor jump), closing it and opening again works
//   - i18n: manifest strings resolve via _locales
//   - page: DE + EN, light + dark, desktop + 360 px phone width — every
//     section rendered, no horizontal overflow, no {{placeholders}}, title/lang
//     switch, shortcut label per platform (⌘K / Strg+K / Ctrl+K), first-run
//     language from navigator.language, renders with localStorage blocked,
//     no exceptions/CSP errors
//
// Usage: node scripts/test-handbook.mjs <chromium-binary>
//        (or BROWSE_TEST_CHROMIUM=<binary>). Needs Node >= 22 (WebSocket).
//        Exit 0 = all checks passed.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = process.argv[2] || process.env.BROWSE_TEST_CHROMIUM;
if (!BIN) {
  console.error('usage: node scripts/test-handbook.mjs <chromium-binary>');
  process.exit(2);
}
const EXT = process.env.BROWSE_HANDBOOK_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'extensions', 'handbook');
let PORT = 0;
const DIRS = [];

const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let chrome = null;
// fresh browser + fresh profile per phase: the page checks must not see tabs
// or state left over from the toolbar checks
function launch() {
  PORT = 9400 + Math.floor(Math.random() * 400);
  const ud = mkdtempSync(join(tmpdir(), 'browse-handbook-test-'));
  DIRS.push(ud);
  chrome = spawn(BIN, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${ud}`,
    '--no-first-run', '--no-default-browser-check', '--lang=en-US',
    '--enable-unsafe-extension-debugging',
    // older snapshots still honour --load-extension with this; newer ones need
    // CDP Extensions.loadUnpacked (tried below when the extension is missing)
    `--load-extension=${EXT}`, '--disable-features=DisableLoadExtensionCommandLineSwitch',
    'about:blank',
  ], { stdio: 'ignore' });
}

let ws; let pws; let seq = 0; const pending = new Map(); const events = [];
const PAGE_WS = 'page-ws'; // pseudo session: the page's own DevTools socket
const onMessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) events.push(m);
};
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      ws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      ws.onmessage = onMessage;
      return;
    } catch { await sleep(200); }
  }
  throw new Error('DevTools endpoint never came up');
}
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const id = ++seq;
  const timer = setTimeout(() => { pending.delete(id); rej(new Error(`${method} timed out`)); }, 15000);
  pending.set(id, (m) => { clearTimeout(timer); res(m); });
  if (sessionId === PAGE_WS) pws.send(JSON.stringify({ id, method, params }));
  else ws.send(JSON.stringify({ id, method, params, sessionId }));
});
async function evaluate(sessionId, expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
  if (r.error || r.result?.exceptionDetails) {
    throw new Error(`evaluate failed: ${JSON.stringify(r.error || r.result.exceptionDetails).slice(0, 400)}`);
  }
  return r.result.result.value;
}
const targets = async () => (await send('Target.getTargets')).result.targetInfos;

try {
  launch();
  await connect();

  // ---- locate (or load) the extension's service worker. Newer Chromium
  // ignores --load-extension but offers CDP Extensions.loadUnpacked (needs
  // --enable-unsafe-extension-debugging); other builds it the other way round.
  let swS = null; let extId = null;
  const loaded = await send('Extensions.loadUnpacked', { path: EXT });
  if (loaded.result?.id) extId = loaded.result.id;
  for (let i = 0; i < 40 && !swS; i++) {
    for (const t of await targets()) {
      if (t.type !== 'service_worker' || !t.url.endsWith('/background.js')) continue;
      if (extId && new URL(t.url).host !== extId) continue;
      const { result } = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
      const ours = await evaluate(result.sessionId, "typeof browseHandbook === 'object'").catch(() => false);
      if (ours) { swS = result.sessionId; extId = new URL(t.url).host; break; }
      await send('Target.detachFromTarget', { sessionId: result.sessionId });
    }
    if (!swS) await sleep(250);
  }
  if (!swS) throw new Error('handbook service worker not found (extension did not load)');
  const PAGE = `chrome-extension://${extId}/handbook.html`;

  const handbookTabs = async () => (await targets()).filter((t) => t.type === 'page' && t.url.split('#')[0] === PAGE);

  // ---- toolbar logic
  await evaluate(swS, 'browseHandbook.openHandbook()');
  await sleep(500);
  await evaluate(swS, 'browseHandbook.openHandbook()');
  await sleep(500);
  check((await handbookTabs()).length === 1, 'two opens → exactly one handbook tab (no duplicates)');

  const [tab] = await handbookTabs();
  const { result: { sessionId: tabS } } = await send('Target.attachToTarget', { targetId: tab.targetId, flatten: true });
  await evaluate(tabS, "location.hash = 'adblock'; true");
  await sleep(300);
  await evaluate(swS, 'browseHandbook.openHandbook()');
  await sleep(500);
  check((await handbookTabs()).length === 1, 'open after #anchor jump → still one tab');

  await evaluate(swS, 'Promise.all([browseHandbook.openHandbook(), browseHandbook.openHandbook()]).then(() => true)');
  await sleep(500);
  check((await handbookTabs()).length === 1, 'concurrent double click → still one tab');

  await send('Target.closeTarget', { targetId: tab.targetId });
  await sleep(500);
  await evaluate(swS, 'browseHandbook.openHandbook()');
  await sleep(700);
  check((await handbookTabs()).length === 1, 'closed tab → next click opens a fresh one');

  const i18n = await evaluate(swS, `(async () => ({
    title: await chrome.action.getTitle({}),
    name: chrome.i18n.getMessage('extName'),
    de: chrome.i18n.getUILanguage(),
  }))()`);
  check(i18n.title === 'Open handbook' && i18n.name === 'browse handbook',
    `manifest strings via _locales (ui ${i18n.de}: "${i18n.title}", "${i18n.name}")`);

  // ---- the page itself
  // page checks in a fresh instance, on the page's own DevTools socket
  ws.close();
  chrome.kill();
  await sleep(500);
  launch();
  await connect();
  let pageInfo = null;
  for (let i = 0; i < 25 && !pageInfo; i++) {
    pageInfo = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page');
    if (!pageInfo) await sleep(200);
  }
  pws = new WebSocket(pageInfo.webSocketDebuggerUrl);
  await new Promise((res, rej) => { pws.onopen = res; pws.onerror = rej; });
  pws.onmessage = onMessage;
  const P = PAGE_WS;
  await send('Runtime.enable', {}, P);
  await send('Log.enable', {}, P);
  await send('Page.enable', {}, P);
  await send('Page.navigate', { url: PAGE }, P);
  await sleep(800);
  const reload = async () => { await send('Page.reload', { ignoreCache: true }, P); await sleep(600); };

  const probe = `(() => {
    const de = document.documentElement;
    const over = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > innerWidth + 0.5)
      .map((el) => el.tagName + (el.id ? '#' + el.id : '') + ':' + (el.textContent || '').slice(0, 40));
    return {
      lang: de.lang, title: document.title,
      sections: document.querySelectorAll('main section').length,
      toc: document.querySelectorAll('nav a').length,
      placeholders: document.body.innerHTML.includes('{{'),
      hScroll: de.scrollWidth > innerWidth,
      overflow: over.slice(0, 5),
      bg: getComputedStyle(document.body).backgroundColor,
      text: document.body.innerText,
      pressed: document.getElementById('lang-' + de.lang).getAttribute('aria-pressed'),
    };
  })()`;

  // first run: language comes from navigator.language
  for (const [locale, want] of [['de-DE', 'de'], ['en-US', 'en']]) {
    await evaluate(P, 'localStorage.clear(); true');
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0', acceptLanguage: locale }, P);
    const added = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `Object.defineProperty(navigator, 'languages', { get: () => ['${locale}'] });`,
    }, P);
    await reload();
    const r = await evaluate(P, probe);
    check(r.lang === want, `first run with browser language ${locale} → ${want} (got ${r.lang})`);
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: added.result.identifier }, P);
  }
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel' }, P);

  const sizes = [['desktop', 1280, 800], ['phone', 360, 640]];
  for (const [label, width, height] of sizes) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: label === 'phone' }, P);
    for (const scheme of ['light', 'dark']) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] }, P);
      for (const lang of ['de', 'en']) {
        await evaluate(P, `document.getElementById('lang-${lang}').click(); true`);
        await sleep(150);
        const r = await evaluate(P, probe);
        const tag = `${label} ${scheme} ${lang}`;
        check(r.lang === lang && r.pressed === 'true', `${tag}: language switch (html lang, aria-pressed)`);
        check(r.title === (lang === 'de' ? 'browse Handbuch' : 'browse handbook'), `${tag}: tab title "${r.title}"`);
        check(r.sections === 8 && r.toc === 8, `${tag}: 8 sections + toc entries`);
        check(!r.placeholders, `${tag}: no unfilled {{placeholder}}`);
        check(!r.hScroll && r.overflow.length === 0, `${tag}: no horizontal overflow ${r.overflow.join(' | ')}`);
        const darkBg = r.bg === 'rgb(11, 18, 32)';
        check(scheme === 'dark' ? darkBg : r.bg === 'rgb(238, 242, 248)', `${tag}: ${scheme} palette (${r.bg})`);
        check(r.text.includes('⌘K'), `${tag}: macOS shortcut label ⌘K`);
        const other = lang === 'de' ? ['Ad blocking out of the box', 'Welcome to browse'] : ['Werbeblocker ab Werk', 'Willkommen bei browse'];
        check(!other.some((s) => r.text.includes(s)), `${tag}: no text of the other language`);
      }
    }
  }

  // Windows/Linux keyboards: Strg+K (DE) / Ctrl+K (EN)
  await send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32',
    userAgentMetadata: { platform: 'Windows', platformVersion: '10.0.0', architecture: 'x86', model: '', mobile: false },
  }, P);
  await reload();
  for (const [lang, label] of [['de', 'Strg+K'], ['en', 'Ctrl+K']]) {
    await evaluate(P, `document.getElementById('lang-${lang}').click(); true`);
    const r = await evaluate(P, probe);
    check(r.text.includes(label) && !r.text.includes('⌘K'), `Windows ${lang}: shortcut label ${label}`);
  }

  // blocked site data: localStorage throws → page must still render
  const blocked = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: "Storage.prototype.getItem = () => { throw new DOMException('blocked', 'SecurityError'); };" +
            "Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };",
  }, P);
  await reload();
  let r = await evaluate(P, probe);
  check(r.sections === 8, 'renders with localStorage blocked');
  await evaluate(P, "document.getElementById('lang-de').click(); true");
  r = await evaluate(P, probe);
  check(r.lang === 'de', 'language toggle works with localStorage blocked');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocked.result.identifier }, P);

  const errors = events.filter((e) => e.method === 'Runtime.exceptionThrown'
    || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
    || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error'));
  check(errors.length === 0, `no exceptions / CSP errors (${errors.map((e) => JSON.stringify(e.params).slice(0, 160)).join(' | ')})`);
} catch (e) {
  check(false, `harness: ${e.message}`);
} finally {
  try { pws?.close(); ws?.close(); } catch { /* closing */ }
  chrome?.kill();
  await sleep(300);
  for (const d of DIRS) rmSync(d, { recursive: true, force: true });
}

console.log(failures.length ? `test-handbook: ${failures.length} check(s) FAILED` : 'test-handbook: all checks passed');
process.exit(failures.length ? 1 : 0);
