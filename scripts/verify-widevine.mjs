// Prüft am laufenden browse per CDP, ob Widevine als Key-System verfügbar
// ist (Komponente vom Component Updater geholt und CDM geladen).
// Browser vorher starten mit --remote-debugging-port=<port>; braucht ein
// Page-Target (nicht den Browser-Socket aus /json/version).
// Usage: node verify-widevine.mjs <port>   — Exit 0 = Widevine verfügbar.
const [port] = process.argv.slice(2);
if (!port) { console.error('usage: node verify-widevine.mjs <port>'); process.exit(2); }

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find((t) => t.type === 'page');
if (!page) { console.error('verify-widevine: no page target'); process.exit(2); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
const timer = setTimeout(() => { console.error('verify-widevine: timeout'); process.exit(2); }, 20000);

const expr = `(async () => {
  const cfg = [{ initDataTypes: ['cenc'],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }] }];
  try {
    const a = await navigator.requestMediaKeySystemAccess('com.widevine.alpha', cfg);
    const c = a.getConfiguration();
    return JSON.stringify({ ok: true, keySystem: a.keySystem,
      video: c.videoCapabilities?.map(v => v.robustness || 'SW_SECURE_CRYPTO') });
  } catch (e) { return JSON.stringify({ ok: false, error: String(e) }); }
})()`;

ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true } }));
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id !== 1) return;
  clearTimeout(timer);
  const r = JSON.parse(msg.result?.result?.value ?? '{"ok":false,"error":"no result"}');
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
};
