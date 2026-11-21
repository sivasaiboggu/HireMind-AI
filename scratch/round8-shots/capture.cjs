// Round 8 headless-Chrome renders via CDP. Usage: node scratch/round8-shots/capture.cjs
// Serves from the vite preview on :4173 (start it first).
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const OUT = path.join(__dirname);
const BASE = 'http://localhost:4173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SEED = JSON.stringify([{
  id: 'seed-round8', timestamp: Date.now(), jobRole: 'Software Engineer', experienceLevel: '2-5 YEARS',
  isLocalAudit: true, atsScore: 72, contentScore: 68, formatScore: 81, overallScore: 73,
  sections: [
    { name: 'Contact Information', score: 100, status: 'pass', feedback: ['Contact Information section found.'] },
    { name: 'Professional Summary', score: 100, status: 'pass', feedback: ['Professional Summary section found.'] },
    { name: 'Work Experience', score: 100, status: 'pass', feedback: ['Work Experience section found.'] },
    { name: 'Education', score: 100, status: 'pass', feedback: ['Education section found.'] },
    { name: 'Skills', score: 100, status: 'pass', feedback: ['Skills section found.'] },
    { name: 'Projects', score: 0, status: 'fail', feedback: ['Add a projects section — ATS parsers look for it by heading.'] },
    { name: 'Certifications', score: 0, status: 'fail', feedback: ['Add a certifications section — ATS parsers look for it by heading.'] },
  ],
  recommendations: [
    { id: 'rec-keywords', priority: 'HIGH', title: 'Add 5 missing keywords', description: 'The job description emphasises kubernetes, docker, terraform, aws, ci/cd — none appear in the resume.' },
    { id: 'rec-sections', priority: 'HIGH', title: 'Add missing sections: Projects, Certifications', description: 'ATS parsers score resumes by recognised headings.' },
    { id: 'rec-metrics', priority: 'MED', title: 'Quantify more achievements', description: 'Only 1 quantified result found. Add numbers to at least 3 bullet points.' },
  ],
  matchedKeywords: ['react', 'typescript', 'node.js', 'python', 'aws'],
  missingKeywords: ['kubernetes', 'docker', 'terraform', 'ci/cd', 'graphql'],
  atsChecklist: [
    { label: 'Contact email present', checked: true },
    { label: 'Phone number present', checked: true },
    { label: 'Work experience section', checked: true },
    { label: 'Skills section', checked: true },
    { label: 'Education section', checked: true },
    { label: 'Quantified achievements (3+)', checked: false },
    { label: 'Resume length 250–1200 words', checked: true },
    { label: 'Job keywords covered (50%+)', checked: false },
  ],
  rewrites: [{ original: 'Worked on backend APIs.', improved: 'Built REST APIs serving 10k requests/day, cutting p95 latency 40%.' }],
}]);

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      const j = await res.json();
      return j.webSocketDebuggerUrl;
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
    ws.onopen = () => resolve({
      ws,
      events,
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const mid = ++id;
          pending.set(mid, { res, rej });
          ws.send(JSON.stringify({ id: mid, method, params }));
        });
      },
    });
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
  const { webSocketDebuggerUrl } = await (await fetch('http://127.0.0.1:9222/json/version')).json();
  void webSocketDebuggerUrl;

  async function newTab() {
    const res = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
    const target = await res.json();
    const tab = await connect(target.webSocketDebuggerUrl);
    await tab.send('Runtime.enable');
    await tab.send('Page.enable');
    await tab.send('Log.enable');
    return tab;
  }

  async function shot(tab, name, url, width, height, opts = {}) {
    await tab.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    if (opts.seed) {
      await tab.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('hiremind_resume_v9', ${JSON.stringify(SEED)});` });
    }
    await tab.send('Page.navigate', { url });
    await sleep(opts.waitMs || 4000);
    if (opts.click) {
      await tab.send('Runtime.evaluate', { expression: opts.click, awaitPromise: true });
      await sleep(opts.afterClickMs || 3000);
    }
    if (opts.evaluate) {
      await tab.send('Runtime.evaluate', { expression: opts.evaluate, awaitPromise: true });
      await sleep(opts.afterClickMs || 1500);
    }
    const { data } = await tab.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(data, 'base64'));
    const errs = tab.events.filter((e) =>
      (e.method === 'Runtime.exceptionThrown') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') ||
      (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error'));
    const overflow = await tab.send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth > document.documentElement.clientWidth', returnByValue: true });
    console.log(`${name}: ${width}x${height} consoleErrors=${errs.length} horizontalOverflow=${overflow.result.value}`);
    for (const e of errs.slice(0, 3)) console.log('  ERR', JSON.stringify(e.params).slice(0, 300));
    return tab;
  }

  const t1 = await newTab();
  await shot(t1, '01-dashboard-desktop.png', `${BASE}/#/dashboard`, 1440, 900);
  await shot(t1, '02-resume-uploader-desktop.png', `${BASE}/#/resume`, 1440, 900);
  const t2 = await newTab();
  await shot(t2, '03-resume-results-desktop.png', `${BASE}/#/resume`, 1440, 900, { seed: true });
  const t3 = await newTab();
  await shot(t3, '04-resume-results-mobile.png', `${BASE}/#/resume`, 390, 844, { seed: true });
  const t4 = await newTab();
  await shot(t4, '05-quiz-setup-desktop.png', `${BASE}/#/quiz`, 1440, 900);
  // Loading screen: click Generate, screenshot mid-flight (spinner = the fixed .animate-spin ring).
  await shot(t4, '06-quiz-loading-desktop.png', `${BASE}/#/quiz`, 1440, 900, {
    click: `(() => { const b=[...document.querySelectorAll('button')].find(x=>/Generate Practice Problems/i.test(x.textContent)); b && b.click(); return true; })()`,
    afterClickMs: 1200,
  });
  // DSA workspace: same tab is now on the loading screen; wait for the bundled fallback to activate.
  await sleep(6000);
  const { data } = await t4.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, '07-quiz-dsa-workspace-desktop.png'), Buffer.from(data, 'base64'));
  const state = await t4.send('Runtime.evaluate', { expression: `document.body.innerText.includes('Question Timer') && document.body.innerText.includes('Local Runner')`, returnByValue: true });
  console.log(`07-quiz-dsa-workspace-desktop.png: dsaWorkspaceActive=${state.result.value}`);
  const t5 = await newTab();
  await shot(t5, '08-quiz-dsa-workspace-mobile.png', `${BASE}/#/quiz`, 390, 844, {
    click: `(() => { const b=[...document.querySelectorAll('button')].find(x=>/Generate Practice Problems/i.test(x.textContent)); b && b.click(); return true; })()`,
    afterClickMs: 9000,
  });
  const mstate = await t5.send('Runtime.evaluate', { expression: `document.body.innerText.includes('Question Timer')`, returnByValue: true });
  console.log(`08-quiz-dsa-workspace-mobile.png: dsaWorkspaceActive=${mstate.result.value}`);
  const moverflow = await t5.send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth > document.documentElement.clientWidth', returnByValue: true });
  console.log(`08 mobile horizontalOverflow=${moverflow.result.value}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
