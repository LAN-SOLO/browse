// Prüft am laufenden browse per CDP, ob Widevine wirklich funktioniert:
//   1. Key-System com.widevine.alpha registriert (Komponente geladen)
//   2. CDM-Prozess startet (createMediaKeys — hier greift die VMP-/Host-Prüfung)
//   3. CDM erzeugt eine echte Lizenzanfrage (generateRequest → message-Event)
// Browser vorher starten mit --remote-debugging-port=<port>; braucht ein
// Page-Target auf einer https-Seite (EME nur im Secure Context). Beim ersten
// Start eines frischen Profils muss der Component Updater das CDM erst holen
// (chrome://components → „Widevine Content Decryption Module“ → Check for update).
// Usage: node verify-widevine.mjs <port>   — Exit 0 = Widevine läuft.
const [port] = process.argv.slice(2);
if (!port) { console.error('usage: node verify-widevine.mjs <port>'); process.exit(2); }

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find((t) => t.type === 'page' && t.url.startsWith('https://'));
if (!page) { console.error('verify-widevine: no https page target'); process.exit(2); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
const timer = setTimeout(() => { console.error('verify-widevine: timeout'); process.exit(2); }, 30000);

const expr = `(async () => {
  const cfg = [{ initDataTypes: ['cenc'],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }] }];
  const out = { ok: false };
  try {
    const access = await navigator.requestMediaKeySystemAccess('com.widevine.alpha', cfg);
    out.keySystem = access.keySystem;
    out.robustness = access.getConfiguration().videoCapabilities.map(v => v.robustness || 'SW_SECURE_CRYPTO');
    const mk = await access.createMediaKeys();
    out.cdmLoaded = true;
    const session = mk.createSession('temporary');
    // Minimaler PSSH-Block (Widevine-System-ID) mit Dummy-Key-ID — reicht,
    // damit das CDM eine Lizenzanfrage baut; ein Lizenzserver ist nicht nötig.
    const pssh = new Uint8Array([0,0,0,52,112,115,115,104,0,0,0,0,237,239,139,169,121,214,74,206,
      163,200,39,220,213,29,33,237,0,0,0,20,8,1,18,16,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
    const msg = new Promise((res, rej) => {
      session.addEventListener('message', e => res({ type: e.messageType, bytes: e.message.byteLength }));
      setTimeout(() => rej(new Error('no license-request message within 10s')), 10000);
    });
    await session.generateRequest('cenc', pssh);
    out.licenseRequest = await msg;
    out.ok = out.licenseRequest.type === 'license-request' && out.licenseRequest.bytes > 0;
  } catch (e) { out.error = String(e); }
  return JSON.stringify(out);
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
