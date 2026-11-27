// Debug: seed, reload, inspect localStorage + wide elements.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const DIST = path.join(ROOT, 'dist/index.html');
const seedJson = fs.readFileSync(path.join(ROOT, 'scratch/seed-resume.json'), 'utf8');
const DEBUG_PORT = 9331;

const policy = 'hatch-webgl-allowed-domains-v1\nexample.com\n';
const file = path.join(os.tmpdir(), 'hiremind-webgl-policy2.txt');
fs.writeFileSync(file, policy);
const sha = createHash('sha256').update(policy).digest('hex');
const chrome = spawn('/opt/meta-chromium/chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--allow-file-access-from-files',
  `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'hiremind-dbg-'))}`,
  `--hatch-webgl-allowed-domains-file=${file}`,
  `--hatch-webgl-allowed-domains-sha256=${sha}`,
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--window-size=1280,900',
  `file://${DIST}#/resume`,
], { stdio: 'ignore' });

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); }
    };
  }
  async call(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    const done = new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return done;
  }
  async eval(expression) {
    const r = await this.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
}

try {
  let targets;
  for (let i = 0; i < 40; i++) { await delay(500); try { targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json(); break; } catch {} }
  const page = targets.find((t) => t.type === 'page');
  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.call('Page.enable'); await cdp.call('Runtime.enable');
  await delay(2000);
  console.log('before seed, localStorage keys:', await cdp.eval(`Object.keys(localStorage).join(',')`));
  console.log('before seed, resume key:', await cdp.eval(`(localStorage.getItem('hiremind_resume_v9')||'null').slice(0,80)`));
  await cdp.eval(`localStorage.setItem('hiremind_resume_v9', ${JSON.stringify(seedJson)}); localStorage.setItem('hiremind_guest_v9','true'); localStorage.setItem('hiremind_guest_role','Software Engineer'); 'seeded'`);
  console.log('after seed, resume key len:', await cdp.eval(`(localStorage.getItem('hiremind_resume_v9')||'').length`));
  await cdp.call('Page.reload', { ignoreCache: true });
  await delay(4000);
  console.log('after reload, resume key len:', await cdp.eval(`(localStorage.getItem('hiremind_resume_v9')||'').length`));
  console.log('page text has ATS 70?', await cdp.eval(`document.body.innerText.includes('70')`));
  console.log('h1/text sample:', await cdp.eval(`document.body.innerText.slice(0, 300)`));
  console.log('scrollWidth:', await cdp.eval(`document.documentElement.scrollWidth`));
  console.log('wide elements:', await cdp.eval(`(() => {
    const vw = document.documentElement.clientWidth; const out = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1 || r.right > vw + 1) out.push(el.tagName + '.' + (el.className && el.className.baseVal === undefined ? String(el.className).slice(0,40) : '') + ' w=' + Math.round(r.width) + ' right=' + Math.round(r.right));
    });
    return out.slice(0, 12).join(' | ');
  })()`));
} finally {
  chrome.kill();
  process.exit(0);
}
