// Loads an unpacked extension into a running Chromium via CDP
// (Extensions.loadUnpacked). Requires the browser to run with
// --remote-debugging-port=<port> --enable-unsafe-extension-debugging.
// Usage: node cdp-load-extension.mjs <port> <extension-dir>
// Needs Node >= 22 (global WebSocket).
const [port, dir] = process.argv.slice(2);
if (!port || !dir) {
  console.error('usage: node cdp-load-extension.mjs <port> <extension-dir>');
  process.exit(2);
}

const { webSocketDebuggerUrl } = await (
  await fetch(`http://127.0.0.1:${port}/json/version`)
).json();

const ws = new WebSocket(webSocketDebuggerUrl);
const timer = setTimeout(() => {
  console.error('cdp-load-extension: timeout');
  process.exit(2);
}, 15000);

ws.onopen = () =>
  ws.send(JSON.stringify({ id: 1, method: 'Extensions.loadUnpacked', params: { path: dir } }));
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id !== 1) return;
  clearTimeout(timer);
  if (msg.error) {
    console.error(`cdp-load-extension: ${msg.error.message}`);
    process.exit(1);
  }
  console.log(msg.result.id);
  process.exit(0);
};
