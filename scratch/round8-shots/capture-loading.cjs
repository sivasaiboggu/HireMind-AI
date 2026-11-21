// Capture the quiz loading screen: stall Gemini network calls so the
// loading state (with the fixed .animate-spin ring) stays up long enough
// to screenshot. Usage: node scratch/round8-shots/capture-loading.cjs
const fs = require('node:fs');
const path = require('node:path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      return (await res.json()).webSocketDebuggerUrl;
    } catch { await sleep(500); }
  }
  throw new Error('chrome devtools not reachable');
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    const events = [];
    ws.onopen = () => resolve({ ws, events, send(method, params = {}) {
      return new Promise((res, rej) => {
        const mid = ++id;
        pending.set(mid, { res, rej });
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    } });
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) {
        const { res, rej } = pending.get(d.id);
        pending.delete(d.id);
        d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result);
      } else if (d.method) events.push(d);
    };
    ws.onerror = reject;
  });
}
async function main() {
  const browser = await connect(await getWsUrl());
  const res = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const target = await res.json();
  const tab = await connect(target.webSocketDebuggerUrl);
  await tab.send('Runtime.enable');
  await tab.send('Page.enable');
  await tab.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  // Stall only Gemini calls; everything else (bundle, CSS) loads normally.
  // A dummy stored key is needed so the client gets past the missing-key
  // throw and actually issues the (stalled) request; the key is never sent
  // anywhere because the fetch never resolves.
  await tab.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('hiremind_gemini_api_key', 'round8-render-only-key');
    const realFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      const url = String(args[0]?.url || args[0] || '');
      if (url.includes('generativelanguage.googleapis.com')) return new Promise(() => {});
      return realFetch(...args);
    };` });
  await tab.send('Page.navigate', { url: 'http://localhost:4173/#/quiz' });
  await sleep(4000);
  await tab.send('Runtime.evaluate', { expression: `(() => { const b=[...document.querySelectorAll('button')].find(x=>/Generate Practice Problems/i.test(x.textContent)); b && b.click(); return !!b; })()`, awaitPromise: true });
  await sleep(1500);
  const loading = await tab.send('Runtime.evaluate', { expression: `document.body.innerText.includes('TAILORING INTERVIEW EXPERIENCES')`, returnByValue: true });
  console.log('loadingScreenVisible=' + loading.result.value);
  const ring = await tab.send('Runtime.evaluate', { expression: `(() => { const el = document.querySelector('.animate-spin'); if (!el) return 'no .animate-spin element'; const cs = getComputedStyle(el); return JSON.stringify({ animationName: cs.animationName, animationDuration: cs.animationDuration, borderRadius: cs.borderRadius, position: cs.position, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }); })()`, returnByValue: true });
  console.log('spinnerRing=' + ring.result.value);
  const { data } = await tab.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '06-quiz-loading-desktop.png'), Buffer.from(data, 'base64'));
  console.log('saved 06-quiz-loading-desktop.png');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
