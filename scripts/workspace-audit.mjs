import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const [before, after, directory] = process.argv.slice(2);
if (!before || !after || !directory || !process.env.AUDIT_MODULE_DIR) {
  throw new Error('Set AUDIT_MODULE_DIR and pass the before URL, after URL, and output directory.');
}
const fromAudit = createRequire(resolve(process.env.AUDIT_MODULE_DIR, 'package.json'));
const { chromium } = fromAudit('playwright-core');
const axePath = fromAudit.resolve('axe-core/axe.min.js');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const output = resolve(directory);
await mkdir(output, { recursive: true });
const origin = (base, path) => new URL(`#/${path}`, base).href;
const results = { layout: [], axe: [], flows: [] };

async function settled(page) {
  await page.locator('h1').waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

async function screenshot(page, file) {
  await settled(page);
  await page.screenshot({ path: resolve(output, `${file}.png`), animations: 'disabled' });
}

async function audit(page, label) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const scan = await window.axe.run();
    return scan.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  });
  results.axe.push({ label, violations });
}

function pageContext(width = 1440, colorScheme = 'light') {
  return browser.newContext({ viewport: { width, height: width > 800 ? 960 : 844 }, colorScheme,
    reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'America/New_York' });
}

function workspace(context, color = 'light') {
  return context.addInitScript(({ color }) => {
    localStorage.setItem('hiremind_theme_v9', color);
  }, { color });
}

async function waitForText(locator, text) {
  await locator.filter({ hasText: text }).first().waitFor();
}

async function add(page, name, role, evidence = '') {
  await page.getByRole('button', { name: 'Add candidate', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Candidate name').fill(name);
  await dialog.getByLabel('Role', { exact: true }).fill(role);
  await dialog.getByLabel('Application notes').fill(evidence);
  await dialog.getByRole('button', { name: 'Add candidate', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
}

async function record(page, name) {
  await page.locator('.candidate-table').getByRole('button', { name: new RegExp(`^${name} `) }).click();
  return page.getByRole('dialog', { name });
}

async function move(dialog, stage) {
  await dialog.getByRole('button', { name: 'Move stage' }).click();
  await dialog.getByLabel('Move to stage').selectOption(stage);
  await dialog.getByRole('button', { name: 'Move candidate' }).click();
  await waitForText(dialog.locator('.stage-label'), stage);
}

async function review(dialog, recommendation, notes) {
  await dialog.getByRole('button', { name: /^(Record|Update) review$/ }).click();
  await dialog.getByLabel('Recommendation').selectOption(recommendation);
  await dialog.getByLabel('Review notes').fill(notes);
  await dialog.getByRole('button', { name: 'Save review' }).click();
  await waitForText(dialog.locator('.record-notes'), notes);
}

async function schedule(dialog, topic, date, duration = '30') {
  await dialog.getByRole('button', { name: /^(Schedule interview|Reschedule)$/ }).click();
  await dialog.getByLabel('Interview topic').fill(topic);
  await dialog.getByLabel('Local date and time').fill(date);
  await dialog.getByLabel('Duration').selectOption(duration);
  await dialog.getByRole('button', { name: 'Save interview' }).click();
}

try {
  for (const width of [1440, 390]) {
    const context = await pageContext(width);
    await workspace(context);
    const page = await context.newPage();
    for (const [side, base] of [['before', before], ['after', after]]) {
      await page.goto(origin(base, 'dashboard'));
      await screenshot(page, `${side}-career-${width}`);
    }
    await context.close();
  }

  const hiring = await pageContext();
  await workspace(hiring);
  const page = await hiring.newPage();
  await page.clock.setFixedTime(new Date('2028-04-03T13:00:00Z'));
  await page.goto(after);
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('link', { name: 'Hiring pipeline' })
    .and(page.locator('[aria-current="page"]')).waitFor();
  await page.getByText('No candidates yet').waitFor();
  for (const [name, role, notes] of [
    ['Ellis Kent', 'Product designer', 'Portfolio includes an onboarding redesign.'],
    ['Ravi Shah', 'Platform engineer', 'Led a database migration and wrote the rollback plan.'],
    ['Maya Ortiz', 'Research lead', 'Led discovery for a new onboarding flow.'],
    ['Sam Idris', 'Product designer', 'Case study covers a new account setup flow.'],
    ['Nia Brooks', 'Platform engineer', 'Built a release pipeline with automated rollbacks.'],
    ['Dana Cho', 'Platform engineer', 'Owned an API migration and documented the rollout.'],
  ]) await add(page, name, role, notes);
  results.flows.push('Add candidate and persist application notes');

  let dialog = await record(page, 'Ravi Shah');
  await move(dialog, 'Review');
  await review(dialog, 'Hold', 'Ask for an example of incident response ownership.');
  assert.equal(await dialog.getByRole('button', { name: 'Schedule interview' }).count(), 0);
  await dialog.getByRole('button', { name: 'Close dialog' }).click();

  dialog = await record(page, 'Maya Ortiz');
  await move(dialog, 'Closed');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();

  dialog = await record(page, 'Nia Brooks');
  await move(dialog, 'Review');
  await review(dialog, 'Advance', 'Release notes show experience with staged rollouts.');
  await schedule(dialog, 'Systems interview', '2028-04-03T10:00');
  await waitForText(dialog.locator('.stage-label'), 'Interview');
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Calendar file' }).click(),
  ]);
  const calendar = await readFile(await file.path(), 'utf8');
  assert.match(calendar, /DTSTART:20280403T140000Z/);
  assert.match(calendar, /DTEND:20280403T143000Z/);
  await audit(page, 'candidate record, desktop');
  await page.waitForFunction(() => document.querySelectorAll('.workspace-toast').length === 0);
  await screenshot(page, 'after-candidate-1440');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  results.flows.push('Record a recommendation, schedule an interview, and export its exact UTC time');

  dialog = await record(page, 'Dana Cho');
  await move(dialog, 'Review');
  await review(dialog, 'Advance', 'Rollout plan addresses error budgets and handover.');
  await schedule(dialog, 'Architecture interview', '2028-04-03T10:15');
  await waitForText(dialog.getByRole('alert'), 'overlaps with Nia Brooks');
  await audit(page, 'scheduling error, desktop');
  await dialog.getByLabel('Local date and time').fill('2028-04-03T10:30');
  await dialog.getByRole('button', { name: 'Save interview' }).click();
  await waitForText(dialog.locator('.stage-label'), 'Interview');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  results.flows.push('Reject overlapping times and allow an adjacent booking');

  await page.clock.setFixedTime(new Date('2028-04-03T14:10:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  dialog = await record(page, 'Nia Brooks');
  await dialog.getByRole('button', { name: 'Mark complete' }).click();
  await dialog.getByRole('button', { name: 'Mark complete' }).click();
  await waitForText(dialog.locator('.record-section'), 'Completed');
  await move(dialog, 'Offer');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.locator('.agenda-list').getByRole('button', { name: /^Dana Cho/ }).waitFor();
  await page.getByRole('button', { name: /^Offer/ }).click();
  assert.equal(await page.locator('.candidate-table tbody tr').count(), 1);
  await page.getByRole('button', { name: 'Show all stages' }).click();
  await page.getByRole('searchbox').fill('ravi engineer');
  assert.equal(await page.locator('.candidate-table tbody tr').count(), 1);
  await page.getByRole('searchbox').fill('');
  await page.getByRole('searchbox').blur();
  results.flows.push('Complete an interview, move to Offer, reload, and combine name and role search');

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 960 : 844 });
    await page.waitForFunction(() => document.querySelectorAll('.workspace-toast').length === 0);
    await screenshot(page, `after-hiring-${width}`);
  }
  await audit(page, 'populated register, mobile');
  dialog = await record(page, 'Dana Cho');
  await audit(page, 'candidate record, mobile');
  await page.setViewportSize({ width: 320, height: 700 });
  await dialog.getByRole('button', { name: 'Reschedule' }).click();
  assert.ok(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth), 'Scheduling form fits at 320 px');
  await audit(page, 'scheduling form, 320px');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await page.getByRole('button', { name: 'Use light theme' }).blur();
  await page.mouse.move(0, 0);
  await screenshot(page, 'after-hiring-dark-1440');
  await page.getByRole('button', { name: 'Use light theme' }).click();
  const other = await hiring.newPage();
  await other.goto(origin(after, 'hiring'));
  await other.getByRole('button', { name: /^Ravi Shah / }).waitFor();
  dialog = await record(page, 'Ravi Shah');
  await dialog.getByRole('button', { name: 'Update review' }).click();
  await dialog.getByLabel('Review notes').fill('A stale edit.');
  const otherRecord = await record(other, 'Ravi Shah');
  await review(otherRecord, 'Decline', 'The evidence did not cover on-call ownership.');
  await dialog.getByRole('button', { name: 'Save review' }).click();
  await waitForText(dialog.getByRole('alert'), 'changed in another view');
  await dialog.getByRole('button', { name: 'Back to record' }).click();
  await waitForText(dialog.locator('.record-notes'), 'The evidence did not cover on-call ownership.');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();

  dialog = await record(page, 'Dana Cho');
  await move(dialog, 'Closed');
  await waitForText(dialog.locator('.record-section'), 'Cancelled');
  await dialog.getByRole('button', { name: 'Delete candidate' }).click();
  await dialog.getByRole('button', { name: 'Delete candidate' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await other.getByRole('button', { name: /^Dana Cho / }).waitFor({ state: 'hidden' });
  results.flows.push('Reject a stale write, show the newer review, cancel on close, and remove the candidate across tabs');
  await hiring.close();

  const routes = ['hiring', 'dashboard', 'resume', 'interview', 'roadmap', 'quiz', 'auth', 'privacy', 'missing'];
  for (const color of ['light', 'dark']) {
    const context = await pageContext(1440, color);
    await workspace(context, color);
    const layout = await context.newPage();
    for (const width of [320, 390, 768, 1440]) {
      await layout.setViewportSize({ width, height: 900 });
      for (const path of routes) {
        await layout.goto(origin(after, path));
        await settled(layout);
        const dimensions = await layout.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
          direction: getComputedStyle(document.documentElement).getPropertyValue('color-scheme'),
        }));
        results.layout.push({ path, theme: color, width, ...dimensions });
        assert.equal(dimensions.direction, color);
        await audit(layout, `${path}, ${color}, ${width}px`);
      }
    }
    await context.close();
  }

  const motionContext = await browser.newContext({ reducedMotion: 'no-preference' });
  const motion = await motionContext.newPage();
  await motion.goto(origin(after, 'hiring'));
  const meter = motion.locator('.stage-meter i').first();
  assert.equal(await meter.evaluate((element) => getComputedStyle(element).transitionProperty), 'transform');
  assert.equal(await meter.evaluate((element) => getComputedStyle(element).transitionDuration), '0.34s');
  await motion.emulateMedia({ reducedMotion: 'reduce' });
  assert.ok(parseFloat(await meter.evaluate((element) => getComputedStyle(element).transitionDuration)) < 0.001);
  results.flows.push('Progress animates with transforms and respects reduced motion');
  await motionContext.close();

  const overflow = results.layout.filter(({ viewport, document }) => document > viewport);
  const violations = results.axe.filter((item) => item.violations.length);
  assert.deepEqual(overflow, [], 'Document overflow');
  assert.deepEqual(violations, [], 'axe violations');
} finally {
  await browser.close();
  await writeFile(resolve(output, 'browser-audit.json'), JSON.stringify(results, null, 2) + '\n');
}
