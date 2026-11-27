// Real Chrome renders for review: desktop 1280px + phone 390px.
// Run: node scratch/shots.mjs [seed]
// Writes scratch/round10-shots/*.png. Modelled on the kirana-commerce
// recipe for this VM: Hatch Chrome needs a WebGL domain-policy file just
// to start, and file:// pages load with --allow-file-access-from-files,
// launched with the first URL as a CLI argument. The built app uses
// relative ./assets paths, so file:// renders work.
// Seed: with the `seed` arg, a realistic local-audit resume is written to
// localStorage before the app boots, so dashboard / results show real data.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const DIST = path.join(ROOT, 'dist/index.html');
const OUT = path.join(ROOT, 'scratch/round10-shots');
fs.mkdirSync(OUT, { recursive: true });
const SEED = process.argv.includes('seed');
const seedJson = SEED ? fs.readFileSync(path.join(ROOT, 'scratch/seed-resume.json'), 'utf8') : null;

const CHROME = '/opt/meta-chromium/chrome';
const DEBUG_PORT = 9395; // Distinctive: 9226-9228 are used by sibling workers.

function chromeArgs(firstUrl) {
  const policy = 'hatch-webgl-allowed-domains-v1\nexample.com\n';
  const file = path.join(os.tmpdir(), 'hiremind-webgl-policy.txt');
  fs.writeFileSync(file, policy);
  const sha = createHash('sha256').update(policy).digest('hex');
  return [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--allow-file-access-from-files',
    `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'hiremind-chrome-'))}`,
    `--hatch-webgl-allowed-domains-file=${file}`,
    `--hatch-webgl-allowed-domains-sha256=${sha}`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=1280,900',
    firstUrl,
  ];
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => { this.ws.onopen = resolve; this.ws.onerror = reject; });
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  async call(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    const done = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return done;
  }
  async eval(expression) {
    const r = await this.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  }
}

async function httpJson(pathname, method = 'GET') {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}${pathname}`, { method });
  return res.json();
}

const pageUrl = (hash) => `file://${DIST}${hash ? '#' + hash : ''}`;

async function shot(cdp, name, hash, { width = 1280, height = 900, mobile = false, theme = null, click = null, waitMs = 3500 } = {}) {
  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile,
  });
  // Seed localStorage before the app boots: a script registered here runs
  // on the new document ahead of the app bundle. Theme is set explicitly
  // every time. Scripts accumulate in registration order, so the latest
  // shot's values win on the next document. The about:blank hop matters:
  // hash-only navigations never create a new document, so without it the
  // registered script would never run at all.
  await cdp.call('Page.navigate', { url: 'about:blank' });
  await delay(300);
  if (seedJson || theme) {
    await cdp.call('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      ${seedJson ? `localStorage.setItem('hiremind_resume_v9', ${JSON.stringify(seedJson)});` : ''}
      localStorage.setItem('hiremind_theme_v9', '${theme || 'dark'}');
      localStorage.setItem('hiremind_guest_v9', 'true');
      localStorage.setItem('hiremind_guest_name', 'Guest Candidate');
      localStorage.setItem('hiremind_guest_role', 'Software Engineer');
    })()` });
  }
  await cdp.call('Page.navigate', { url: pageUrl(hash) });
  await delay(1200);
  if (click) {
    try { await cdp.eval(click); } catch (e) { console.log(`  click step failed for ${name}: ${String(e).slice(0, 120)}`); }
    await delay(1500);
  }
  await delay(waitMs);
  // Guard: this VM runs several headless Chromes side by side. If the tab
  // is showing another project, the shot is worthless — fail loudly.
  const href = await cdp.eval(`location.href`);
  if (!href.includes('HireMind-AI/dist')) throw new Error(`tab is not HireMind: ${href}`);
  const { data } = await cdp.call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, name), Buffer.from(data, 'base64'));
  const overflow = await cdp.eval(`document.documentElement.scrollWidth + 'x' + document.documentElement.scrollHeight + ' body:' + document.body.scrollWidth`);
  console.log(`  ${name}  (scroll: ${overflow})`);
}

const chrome = spawn(CHROME, chromeArgs(pageUrl('/')), { stdio: 'ignore' });
try {
  let targets;
  for (let i = 0; i < 40; i++) {
    await delay(500);
    try { targets = await httpJson('/json'); break; } catch { /* not up yet */ }
  }
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');

  console.log('desktop, dark, seeded:');
  await shot(cdp, '01-dashboard-desktop.png', '/dashboard');
  await shot(cdp, '02-resume-uploader-desktop.png', '/resume', { click: `(() => { const b=[...document.querySelectorAll('button')].find(x=>/run another/i.test(x.textContent)); if(b){b.click(); return 'reset-clicked';} return 'no-reset-button'; })()` });
  await shot(cdp, '03-resume-results-desktop.png', '/resume');
  await shot(cdp, '04-quiz-setup-desktop.png', '/quiz');
  await shot(cdp, '05-roadmap-setup-desktop.png', '/roadmap');
  await shot(cdp, '06-interview-setup-desktop.png', '/interview');
  await shot(cdp, '07-auth-desktop.png', '/auth');
  console.log('desktop, light:');
  await shot(cdp, '08-dashboard-light-desktop.png', '/dashboard', { theme: 'light' });
  console.log('mobile 390px, seeded:');
  await shot(cdp, '09-dashboard-mobile.png', '/dashboard', { width: 390, height: 844, mobile: true, theme: null });
  await shot(cdp, '10-resume-results-mobile.png', '/resume', { width: 390, height: 844, mobile: true });
  await shot(cdp, '11-quiz-setup-mobile.png', '/quiz', { width: 390, height: 844, mobile: true });
  console.log('done:', fs.readdirSync(OUT).join(', '));
} catch (e) {
  console.error('SHOT-ERROR', e);
} finally {
  chrome.kill();
  process.exit(0);
}
