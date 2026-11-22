const { test } = require('node:test');
const assert = require('node:assert/strict');
const { store } = require('./store-fixture.cjs');

test('theme and sidebar toggles do not throw when storage writes are denied', () => {
  const { store: s } = store(false, true);
  assert.doesNotThrow(() => {
    s.getState().toggleTheme();
    s.getState().toggleTheme();
    s.getState().toggleSidebar();
    s.getState().setSidebarCollapsed(true);
    s.getState().setGuestMode(true);
  });
  assert.equal(s.getState().theme, 'dark');
  assert.equal(s.getState().sidebarCollapsed, true);
});

test('safe storage helpers report denied reads and writes instead of throwing', () => {
  const { exports: exp } = store(false, true, { readFails: true });
  assert.equal(exp.safeLocalGet('hiremind_guest_name'), null);
  assert.equal(exp.safeLocalSet('hiremind_guest_name', 'Siva'), false);
  const ok = store(false);
  assert.equal(ok.exports.safeLocalSet('hiremind_guest_name', 'Siva'), true);
  assert.equal(ok.exports.safeLocalGet('hiremind_guest_name'), 'Siva');
});

test('signed-in credit spend syncs to the server and keeps the deduction', async () => {
  const { store: s, service } = store();
  let synced;
  service.updateProfile = async (id, patch) => { synced = { id, patch }; return { id, credits: patch.credits }; };
  s.setState({ user: { id: 'one' }, profile: { id: 'one', credits: 100 }, credits: 100 });
  assert.equal(await s.getState().useCredit(5), true);
  assert.equal(s.getState().credits, 95);
  assert.equal(synced.id, 'one');
  assert.equal(synced.patch.credits, 95);
});

test('failed server credit sync rolls the local deduction back and fails closed', async () => {
  const { store: s } = store(true, false, { updateProfileFails: true });
  s.setState({ user: { id: 'one' }, profile: { id: 'one', credits: 100 }, credits: 100 });
  assert.equal(await s.getState().useCredit(5), false);
  assert.equal(s.getState().credits, 100);
  assert.equal(s.getState().profile.credits, 100);
  assert.deepEqual(Array.from(s.getState().toasts, (t) => t.type), ['error']);
});

test('guest credit spend rolls back when local storage cannot persist it', async () => {
  const { store: s } = store(false, true);
  assert.equal(s.getState().credits, 100);
  assert.equal(await s.getState().useCredit(5), false);
  assert.equal(s.getState().credits, 100);
  assert.deepEqual(Array.from(s.getState().toasts, (t) => t.type), ['error']);
});

test('guest credit spend persists when storage works', async () => {
  const { store: s, storage } = store(false);
  assert.equal(await s.getState().useCredit(5), true);
  assert.equal(s.getState().credits, 95);
  assert.equal(storage.get('hiremind_credits_v9'), '95');
});

test('addToast honours its duration instead of always using 4000 ms', () => {
  const delays = [];
  const { store: s } = store(true, false, { setTimeout: (fn, delay) => { delays.push(delay); } });
  s.getState().addToast('info', 'default lifetime');
  s.getState().addToast('info', 'long-lived notice', 9000);
  assert.deepEqual(delays, [4000, 9000]);
  assert.equal(s.getState().toasts[1].duration, 9000);
});

test('out-of-credits error names the real refill route, not a PRO plan', async () => {
  const guest = store(false);
  guest.store.setState({ credits: 0 });
  assert.equal(await guest.store.getState().useCredit(5), false);
  const guestToast = guest.store.getState().toasts.at(-1).message;
  assert.match(guestToast, /refresh button in the sidebar to refill to 100/);
  assert.doesNotMatch(guestToast, /PRO/);

  const signedIn = store();
  signedIn.store.setState({ user: { id: 'one' }, profile: { id: 'one', credits: 0 }, credits: 0 });
  assert.equal(await signedIn.store.getState().useCredit(5), false);
  const signedInToast = signedIn.store.getState().toasts.at(-1).message;
  assert.match(signedInToast, /sync your credits from your account/);
  assert.doesNotMatch(signedInToast, /PRO/);
});
