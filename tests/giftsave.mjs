import { chromium } from 'playwright';
import { digestOfServer } from './digest.mjs';

const BASE = process.argv[2];
let fails = 0;
let total = 0;
// The suite counts its own assertions. A hand-written count in a report is a
// number with no basis, and this one was quoted as 24 when it was 27.
const ok = (n, c, d='') => { total++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? '  :: ' + d : ''}`); if (!c) fails++; };

// BUILD GATE -- same bytes-over-names gate as sitecheck.mjs. This file exists
// because giftcheck.mjs did NOT carry one, and that is exactly the hole that
// produced a false green earlier today: a mutant failed to compile, dist/ kept
// the previous bundle, and the run reported on an artifact that did not
// correspond to the source. CANNOT CHECK is a refusal here, never a pass.
{
  let manifest = null;
  try { manifest = JSON.parse(await (await import('node:fs/promises')).readFile(process.env.EXPECT_MANIFEST || '', 'utf8')); }
  catch { manifest = null; }
  if (!manifest) { console.log('BUILD GATE: EXPECT_MANIFEST not readable. CANNOT CHECK, REFUSING.'); process.exit(2); }
  const r = await digestOfServer(BASE, manifest);
  if (!r.ok) { console.log(`BUILD GATE: ${r.why}. CANNOT CHECK, REFUSING.`); process.exit(2); }
  if (!process.env.EXPECT_DIGEST) { console.log('BUILD GATE: EXPECT_DIGEST not set. CANNOT CHECK, REFUSING.'); process.exit(2); }
  if (r.digest !== process.env.EXPECT_DIGEST) {
    console.log(`BUILD GATE: served digest ${r.digest.slice(0,16)} != build ${process.env.EXPECT_DIGEST.slice(0,16)}. REFUSING.`);
    process.exit(2);
  }
  console.log(`   served digest: ${r.digest.slice(0,16)}  over ${r.count} files`);
}

const ENDPOINT_RE = /berrova-gifting-9f3d/;
const GRACE = 1500;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

// One page per case, fully isolated. `save` is 'ok' | 'fail' | 'abort'.
async function runCase({ name, save, query = '', fill = {}, blurAfterSubmit = false, waitMs, status = 500, errorBody = 'nope', code = undefined }) {
  const p = await b.newPage();
  const posts = [];
  // A mailto: navigation IS observable here, established by running it rather
  // than assumed: Chromium surfaces it as a request event with a mailto: URL
  // and logs "Launched external handler". Both the POST and the mailto land in
  // `order`, so the sequence is read off the browser instead of off the source.
  const order = [];
  const mailtos = [];
  p.on('request', (r) => {
    const u = r.url();
    if (u.startsWith('mailto:')) { mailtos.push(u); order.push('mailto'); }
  });
  await p.route(ENDPOINT_RE, async (route) => {
    order.push('post');
    const req = route.request();
    posts.push({ url: req.url(), method: req.method(), headers: req.headers(), body: req.postData() || '' });
    if (save === 'abort') return route.abort('failed');
    if (save === 'fail') return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(code ? { ok: false, code, error: errorBody } : { ok: false, error: errorBody }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  await p.goto(BASE + '/gifting' + query, { waitUntil: 'networkidle' });

  // FIXTURE GUARD. If the form or its fields are not here, this test is
  // asserting nothing and must say so rather than pass. A fixture that can
  // vanish while the test still passes is not a test.
  const form = p.locator('form[aria-label="Gifting inquiry"]');
  if (await form.count() !== 1) { console.log(`FIXTURE MISSING: no gifting form on /gifting (${name}). REFUSING.`); process.exit(2); }
  for (const f of ['name', 'email', 'company', 'qty', 'message']) {
    if (await form.locator(`[name="${f}"]`).count() !== 1) { console.log(`FIXTURE MISSING: field "${f}" (${name}). REFUSING.`); process.exit(2); }
  }

  for (const [k, v] of Object.entries(fill)) await form.locator(`[name="${k}"]`).fill(v);
  await form.locator('button[type="submit"]').click();

  if (blurAfterSubmit) {
    await p.waitForTimeout(150);
    await p.evaluate(() => window.dispatchEvent(new Event('blur')));
  }

  await p.waitForTimeout(waitMs);
  // Read the ONE live-region the form owns, not every <p> on the page. The
  // first version of this joined all paragraphs, which made every negative
  // assertion ("the note does NOT say we hold it") pass against a wall of
  // marketing copy whether the note was right or not.
  const noteEl = p.locator('form[aria-label="Gifting inquiry"] p[role="status"]');
  if (await noteEl.count() !== 1) { console.log(`FIXTURE MISSING: expected exactly 1 status note, saw ${await noteEl.count()} (${name}). REFUSING.`); process.exit(2); }
  const note = (await noteEl.textContent()) || '';
  const panel = await p.locator('textarea[readonly]').count();
  const panelText = panel ? await p.locator('textarea[readonly]').inputValue() : '';
  await p.close();
  return { posts, note, panel, panelText, mailtos, order };
}

console.log('\n=== CASE A: save succeeds, no mail app ===');
{
  const r = await runCase({
    name: 'A', save: 'ok', waitMs: GRACE + 700,
    fill: { name: 'Ada Byron', company: 'Analytical Co', email: 'ada@example.com', qty: '250 boxes', message: 'Q4 client gifts.' },
  });
  ok('A1 exactly one POST to the gifting webhook', r.posts.length === 1, `saw ${r.posts.length}`);
  const body = r.posts[0]?.body || '';
  const ct = r.posts[0]?.headers['content-type'] || '';
  ok('A2 posted form-encoded (CORS simple request, no preflight)', ct.startsWith('application/x-www-form-urlencoded'), ct || 'no content-type');
  const parsed = new URLSearchParams(body);
  ok('A3 name carried', parsed.get('name') === 'Ada Byron', parsed.get('name'));
  ok('A4 email carried', parsed.get('email') === 'ada@example.com', parsed.get('email'));
  ok('A5 company carried', parsed.get('company') === 'Analytical Co', parsed.get('company'));
  ok('A6 quantity carried', parsed.get('qty') === '250 boxes', parsed.get('qty'));
  ok('A7 message carried', parsed.get('message') === 'Q4 client gifts.', parsed.get('message'));
  ok('A8 source defaults to gifting-form', parsed.get('source') === 'gifting-form', parsed.get('source'));
  ok('A9 note confirms we HOLD the inquiry', /we have your inquiry/i.test(r.note), r.note.slice(0, 120));
  ok('A10 fallback panel offered after mail did not open', r.panel === 1, `panels=${r.panel}`);
  ok('A11 panel carries the composed inquiry', /Ada Byron/.test(r.panelText) && /250 boxes/.test(r.panelText), r.panelText.slice(0, 80));
  ok('A12 panel does NOT alarm: says nothing for them to do', /nothing for you to do/i.test(r.note), r.note.slice(0, 160));
  ok('A13 a mailto: navigation was actually attempted', r.mailtos.length === 1, `saw ${r.mailtos.length}`);
  // NO ordering assertion here on purpose, and this is a retraction. A14 used
  // to read the sequence off `order` and assert 'post>mailto'. It PASSED on a
  // mutant with the mailto hoisted above the save, because Chromium raises the
  // external-handler request event asynchronously: the event order is not the
  // source order. An assertion that looks like it proves ordering and cannot
  // fail on the inversion is worse than none, so ordering is proved in CASE G
  // by gating instead, which the same mutant kills.
}

console.log('\n=== CASE B: save FAILS -- panel must be up before the grace window elapses ===');
{
  const r = await runCase({
    name: 'B', save: 'fail', waitMs: 400,
    fill: { name: 'Grace Hopper', email: 'grace@example.com' },
  });
  ok('B1 the POST was still attempted', r.posts.length === 1, `saw ${r.posts.length}`);
  ok('B2 panel is up IMMEDIATELY, not after the 1500ms watch', r.panel === 1, `panels=${r.panel} at 400ms`);
  ok('B3 note says we could NOT record it', /could not record/i.test(r.note), r.note.slice(0, 160));
  ok('B4 note does not falsely claim we hold it', !/we have your inquiry/i.test(r.note), r.note.slice(0, 160));
  ok('B5 panel carries the composed inquiry', /Grace Hopper/.test(r.panelText), r.panelText.slice(0, 60));
}

console.log('\n=== CASE C: save succeeds AND mail opens -- no panel ===');
{
  const r = await runCase({
    name: 'C', save: 'ok', blurAfterSubmit: true, waitMs: GRACE + 700,
    fill: { name: 'Alan Turing', email: 'alan@example.com' },
  });
  ok('C1 POST fired', r.posts.length === 1, `saw ${r.posts.length}`);
  ok('C2 no fallback panel when mail took over', r.panel === 0, `panels=${r.panel}`);
  ok('C3 note still confirms we hold it', /we have your inquiry/i.test(r.note), r.note.slice(0, 120));
}

console.log('\n=== CASE D: empty form -- nothing is sent anywhere ===');
{
  const r = await runCase({ name: 'D', save: 'ok', waitMs: 600, fill: {} });
  ok('D1 NO request made on an empty form', r.posts.length === 0, `saw ${r.posts.length}`);
  ok('D2 visitor is told what is missing', /please add your name and email/i.test(r.note), r.note.slice(0, 120));
  ok('D3 no fallback panel', r.panel === 0, `panels=${r.panel}`);
}

console.log('\n=== CASE E: ?src= attribution reaches the row ===');
{
  const r = await runCase({
    name: 'E', save: 'ok', query: '?src=instagram-bio', waitMs: 400,
    fill: { name: 'Katherine Johnson', email: 'kj@example.com' },
  });
  ok('E1 POST fired', r.posts.length === 1, `saw ${r.posts.length}`);
  ok('E2 source is the campaign tag, not the default', new URLSearchParams(r.posts[0]?.body || '').get('source') === 'instagram-bio', new URLSearchParams(r.posts[0]?.body || '').get('source'));
}

console.log('\n=== CASE F: network error is read as NOT saved ===');
{
  const r = await runCase({
    name: 'F', save: 'abort', waitMs: 400,
    fill: { name: 'Margaret Hamilton', email: 'mh@example.com' },
  });
  ok('F1 a dead network does not read as a save', !/we have your inquiry/i.test(r.note), r.note.slice(0, 160));
  ok('F2 panel is up immediately', r.panel === 1, `panels=${r.panel} at 400ms`);
}

console.log('\n=== CASE G: the save GATES the mail draft (held route) ===');
// The decisive form of "save first". Case A reads the order off two events and
// would still pass if the mailto merely happened to lose a race. Here the save
// is held open and never answered: if mail is genuinely downstream of an
// awaited save, it CANNOT open while the save is in flight. If the mailto were
// hoisted above the fetch, it fires immediately and this case goes red.
//
// G2 is the anti-vacuity half. G1 asserts an ABSENCE, and an absence proves
// nothing unless the thing is observable at all in this harness -- so the route
// is then released and the mailto must appear.
{
  const p = await b.newPage();
  const order = [];
  const mailtos = [];
  let held = null;
  p.on('request', (r) => { if (r.url().startsWith('mailto:')) { mailtos.push(r.url()); order.push('mailto'); } });
  await p.route(ENDPOINT_RE, async (route) => { order.push('post'); held = route; });

  await p.goto(BASE + '/gifting', { waitUntil: 'networkidle' });
  const form = p.locator('form[aria-label="Gifting inquiry"]');
  if (await form.count() !== 1) { console.log('FIXTURE MISSING: no gifting form on /gifting (G). REFUSING.'); process.exit(2); }
  await form.locator('[name="name"]').fill('Held Open');
  await form.locator('[name="email"]').fill('held@example.com');
  await form.locator('button[type="submit"]').click();
  await p.waitForTimeout(1200);

  ok('G1 the save was attempted', order.includes('post'), order.join('>') || 'nothing observed');
  ok('G2 NO mail draft opened while the save was still in flight', mailtos.length === 0, `saw ${mailtos.length} after 1200ms`);
  const btn = form.locator('button[type="submit"]');
  ok('G3 the button stays busy for the whole in-flight window', await btn.isDisabled(), `disabled=${await btn.isDisabled()}`);

  if (held) await held.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  await p.waitForTimeout(900);
  ok('G4 released: the mail draft DOES open, so G2 was not vacuous', mailtos.length === 1, `saw ${mailtos.length} after release`);
  // G5 was dropped for the same reason A14 was: it compared event order, and
  // event order survived the inversion. G2 plus G4 is the pair that binds --
  // absent while held, present once released.
  await p.close();
}

console.log('\n=== CASE H: a 400 is the visitor\'s input, not our outage ===');
// The webhook refuses a malformed email with 400 and a sentence saying what to
// fix. Before this case existed the site discarded that sentence and told the
// visitor "we could not record your inquiry", which blames us for their typo
// and then opens a mail draft carrying the bad address.
{
  const r = await runCase({
    name: 'H', save: 'fail', status: 400, code: 'invalid_input',
    errorBody: 'Please add your name and a valid email so we can reply.',
    waitMs: GRACE + 700,
    fill: { name: 'Typo Person', email: 'bob' },
  });
  ok('H1 the POST was attempted', r.posts.length === 1, `saw ${r.posts.length}`);
  ok('H2 the visitor is shown the webhook\'s own message', /valid email/i.test(r.note), r.note.slice(0, 160));
  ok('H3 we do NOT blame ourselves for their typo', !/could not record/i.test(r.note), r.note.slice(0, 160));
  ok('H4 we do NOT claim to hold it', !/we have your inquiry/i.test(r.note), r.note.slice(0, 160));
  ok('H5 no mail draft opens with the malformed address in it', r.mailtos.length === 0, `saw ${r.mailtos.length}`);
  ok('H6 no copy-it-yourself panel: nothing was lost yet', r.panel === 0, `panels=${r.panel}`);
}

console.log('\n=== CASE I: a 400 we do NOT recognise must keep the lead ===');
// CASE H pins the behaviour GIVEN a 400. This pins what a 400 MEANS, which is
// the half that was missing. The site stops before the mail step only on the
// webhook's own code invalid_input; every other 400 is treated as a failed
// save, because the alternative is swallowing a real inquiry with no row, no
// mail and no panel the day someone adds a rate limit.
//
// Without this case, keying off the bare status passes everything H asserts.
{
  const r = await runCase({
    name: 'I', save: 'fail', status: 400, code: 'rate_limited',
    errorBody: 'Too many requests, try again shortly.',
    waitMs: 400,
    fill: { name: 'Real Prospect', company: 'Acme', email: 'real@example.com', qty: '500 boxes' },
  });
  ok('I1 the POST was attempted', r.posts.length === 1, `saw ${r.posts.length}`);
  ok('I2 an unrecognised 400 does NOT read as the visitor\'s fault', !/too many requests/i.test(r.note), r.note.slice(0, 160));
  ok('I3 the lead is kept: fallback panel is up', r.panel === 1, `panels=${r.panel}`);
  ok('I4 the panel carries the inquiry', /Real Prospect/.test(r.panelText) && /500 boxes/.test(r.panelText), r.panelText.slice(0, 80));
  ok('I5 we do not claim to hold it', !/we have your inquiry/i.test(r.note), r.note.slice(0, 160));
}

await b.close();
console.log(`\n${total} assertions run`);
console.log(fails === 0 ? '=== ALL PASS ===' : `=== ${fails} FAILURE(S) ===`);
process.exit(fails === 0 ? 0 : 1);
