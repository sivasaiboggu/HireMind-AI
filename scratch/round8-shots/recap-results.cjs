// Re-capture seeded resume results (desktop + mobile) with a longer wait
// and an explicit state check. Usage: node scratch/round8-shots/recap-results.cjs
const fs = require('node:fs');
const path = require('node:path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cap = fs.readFileSync(path.join(__dirname, 'capture.cjs'), 'utf8');
const seedSrc = cap.match(/const SEED = (JSON\.stringify\(\[\{[\s\S]*?\}\]\));/)[1];
const SEED = eval(seedSrc); // eslint-disable-line no-eval

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try { const res = await fetch('http://127.0.0.1:9222/json/version'); return (await res.json()).webSocketDebuggerUrl; }
    catch { await sleep(500); }
  }
  throw new Error('chrome devtools not reachable');
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url); let id = 0; const pending = new Map();
    ws.onopen = () => resolve({ send(method, params = {}) {
      return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
    } });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } };
    ws.onerror = reject;
  });
}
async function main() {
  const browser = await connect(await getWsUrl());
  for (const [name, width, height] of [['03-resume-results-desktop.png', 1440, 900], ['04-resume-results-mobile.png', 390, 844]]) {
    const res = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
    const target = await res.json();
    const tab = await connect(target.webSocketDebuggerUrl);
    await tab.send('Runtime.enable');
    await tab.send('Page.enable');
    await tab.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    await tab.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('hiremind_resume_v9', ${JSON.stringify(SEED)});` });
    await tab.send('Page.navigate', { url: 'http://localhost:4173/#/resume' });
    let state = 'unknown';
    for (let i = 0; i < 10; i++) {
      await sleep(1500);
      const r = await tab.send('Runtime.evaluate', { expression: `document.body.innerText.includes('Local ATS audit') || document.body.innerText.includes('Download report') ? 'results' : (document.body.innerText.includes('Loading...') ? 'loading' : 'other')`, returnByValue: true });
      state = r.result.value;
      if (state === 'results') break;
    }
    console.log(`${name}: state=${state}`);
    const { data } = await tab.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, name), Buffer.from(data, 'base64'));
    const overflow = await tab.send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth > document.documentElement.clientWidth', returnByValue: true });
    console.log(`${name}: horizontalOverflow=${overflow.result.value}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
