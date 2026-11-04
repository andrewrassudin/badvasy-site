/* Hover stillness check.
   Usage (server running in repo root: python3 -m http.server 8123):
     node tools/qa-hover.js            -> checks v2 and v3 at 1440 and 1280
     node tools/qa-hover.js v3 1920    -> one version, one width
   For every interactive element it hovers, waits for transitions to end and
   compares the position/size of every descendant (text, icons, blocks) and of
   every section on the page. Anything that moved more than 0.5px fails.
   Photos (<img>) may zoom inside a fixed frame, so they are ignored.
   Exit code 1 when something moved. */
const { chromium } = require('playwright');
const [, , onlyV, onlyW] = process.argv;
const versions = onlyV ? [onlyV] : ['v2', 'v3'];
const widths = onlyW ? [+onlyW] : [1440, 1280];
const SEL = 'a, button, .bx, .dc, .ab, .tl li, .acc-i, .pt-grid li, .qr, .qrc, .ni, .nb, .nw, .wf, .mi, .mcard, .dd-i, .cinfo a';

(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (const v of versions) for (const w of widths) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(`http://localhost:8123/${v}/?${Date.now()}`, { waitUntil: 'networkidle' });
    // finish entrance animations so they don't count as hover movement
    await p.addStyleTag({ content: '[data-r],[data-split] .w>span,[data-img],.rv{opacity:1!important;transform:none!important;clip-path:none!important} .st-bar i,.sc-bar i{animation:none!important} .st-txt>div{transition:none!important}' });
    const H = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 400) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(40); }
    await p.waitForTimeout(1500);
    const n = await p.evaluate(s => {
      const els = [...document.querySelectorAll(s)].filter(e => !e.closest('.mq,.mob,.mega,.dd-p,[aria-hidden=true],.skip') && e.offsetParent);
      els.forEach((e, i) => e.setAttribute('data-qa', i)); return els.length;
    }, SEL);
    const snap = i => p.evaluate(i => {
      const e = document.querySelector(`[data-qa="${i}"]`);
      const parts = [e, ...e.querySelectorAll('*')].filter(x => x.tagName !== 'IMG' && !x.closest('svg>*') && !x.closest('.ax svg') && x.getClientRects().length)
        .map(x => { const r = x.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(n => Math.round(n * 2) / 2); });
      const secs = [...document.querySelectorAll('main>section,footer')].map(x => Math.round(x.getBoundingClientRect().top + scrollY));
      return { parts, secs };
    }, i);
    for (let i = 0; i < n; i++) {
      const loc = p.locator(`[data-qa="${i}"]`);
      await p.evaluate(i => document.querySelector(`[data-qa="${i}"]`).scrollIntoView({ block: 'center' }), i);
      await p.mouse.move(1, 1); await p.waitForTimeout(1000); // let scroll-triggered entrance motion settle first
      const box = await loc.boundingBox(); if (!box || box.width < 2) continue;
      const a = await snap(i);
      await p.mouse.move(box.x + Math.min(24, box.width / 2), box.y + Math.min(16, box.height / 2));
      await p.waitForTimeout(950);
      const c = await snap(i);
      // brand accordion cards are meant to widen: there only the vertical position of what is inside is checked
      const acc = await loc.evaluate(e => e.classList.contains('bx'));
      // v2 timeline cards are meant to open downward (own height grows, nothing else moves)
      const grows = await loc.evaluate(e => !!e.closest('.tl') && e.tagName === 'LI');
      const moved = acc
        ? a.parts.findIndex((r, k) => k > 0 && c.parts[k] && Math.abs((r[1] + r[3]) - (c.parts[k][1] + c.parts[k][3])) > 0.5 && r[3] === c.parts[k][3])
        : grows
        ? a.parts.findIndex((r, k) => c.parts[k] && [0, 1, 2].some(j => Math.abs(r[j] - c.parts[k][j]) > 0.5))
        : a.parts.findIndex((r, k) => c.parts[k] && r.some((x, j) => Math.abs(x - c.parts[k][j]) > 0.5));
      const secMoved = a.secs.some((x, k) => Math.abs(x - c.secs[k]) > 0.5);
      if (moved >= 0 || secMoved) {
        bad++;
        const label = await p.evaluate(i => { const e = document.querySelector(`[data-qa="${i}"]`); return (e.className || e.tagName) + ' «' + e.textContent.trim().slice(0, 30) + '»'; }, i);
        console.log(`${v} @${w}: MOVES on hover → ${label}${secMoved ? ' (pushes the page)' : ''}${moved >= 0 ? ` part#${moved} ${JSON.stringify(a.parts[moved])}→${JSON.stringify(c.parts[moved])}` : ''}`);
      }
    }
    console.log(`${v} @${w}: checked ${n} elements`);
    await p.close();
  }
  await b.close();
  if (bad) { console.log(`FAIL: ${bad} hover(s) move something`); process.exit(1); }
  console.log('OK: no hover moves anything');
})();
