// e2e for the "submit your odd site" page. Usage: node e2e-odd.cjs [url]  (default https://cleverdates.com/odd-preview/)
// Three inputs: (1) a bad URL, (2) emoji and quotes in the "why" line, (3) a missing handle. Plus: nothing stored, nothing sent, noindex,
// unlinked from the home, not in the sitemap, C2 home still has its for-sale footer, fallback and copy-to-clipboard.
const { chromium } = require('/workspace/repos/ych-footer-ai-credit/node_modules/playwright');
const base = (process.argv[2] || 'https://cleverdates.com/odd-preview/').replace(/[#?].*$/, '');
const origin = new URL(base).origin;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS ' + m); } else { fail++; console.log('FAIL ' + m); } };
const parse = (href) => { const m = href.match(/^mailto:([^?]+)\?subject=([^&]*)&body=(.*)$/); return m && { to: m[1], subject: decodeURIComponent(m[2]), body: decodeURIComponent(m[3]) }; };

(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, permissions: ['clipboard-read', 'clipboard-write'] }, );
  await c.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const reqs = [], errs = [];
  const page = async () => { const p = await c.newPage(); p.on('request', (r) => reqs.push(r.url())); p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(() => { window.__mail = []; document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href^="mailto:"]'); if (a) { window.__mail.push(a.getAttribute('href')); e.preventDefault(); } }, true); });
    await p.goto(base, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); return p; };
  const mails = (p) => p.evaluate(() => window.__mail.slice());
  const vis = (p, id) => p.evaluate((i) => !document.getElementById(i).hidden, id);
  const err = (p, k) => p.evaluate((i) => ({ t: document.getElementById('e-' + i).textContent, inv: document.getElementById('f-' + i).getAttribute('aria-invalid') }), k);

  // Page basics
  { const p = await page();
    const meta = await p.evaluate(() => ({ r: (document.querySelector('meta[name=robots]') || {}).content, canon: (document.querySelector('link[rel=canonical]') || {}).href, csp: (document.querySelector('meta[http-equiv=Content-Security-Policy]') || {}).content }));
    ok(/noindex/.test(meta.r || '') && meta.canon === 'https://cleverdates.com/odd-preview/', 'page is noindex and canonical is the preview URL');
    ok(/form-action 'none'/.test(meta.csp) && /connect-src 'none'/.test(meta.csp), 'CSP blocks form posts and network connections');
    ok((await p.evaluate(() => document.querySelectorAll('form[action], form[method=post]').length)) === 0, 'form has no action and does not post');
    ok(await p.evaluate(() => document.body.innerText.includes('Made or found something small and odd? Send the link.')), 'lede is Shears\'s exact line');
    ok(await p.evaluate(() => document.body.innerText.includes('We read every submission before anything gets featured.') && document.body.innerText.includes('We read each submission, then decide what to feature.') && (document.body.innerText.match(/Nothing is featured automatically\./g) || []).length === 1), 'review line and list item 2 use We-read wording; featured-automatically sentence appears once');
    ok(await p.evaluate(() => { const t = document.documentElement.outerHTML; const ban = new RegExp('a per' + 'son|' + 'hu' + 'man', 'i'); return !ban.test(t); }), 'page HTML has none of the leftover who-reads wording');
    ok(await p.evaluate(() => /We check each site's deeper pages before featuring it, and skip anything with slurs or explicit content/.test(document.body.innerText)), 'deeper-pages and slurs/explicit-content line is under What happens next');
    ok(await p.evaluate(() => !/within \d|hours|days|odds|chance of|guarantee/i.test(document.body.innerText)), 'no reply time, odds or guarantee promised');
    ok(await p.evaluate(() => document.getElementById('f-why').maxLength === 140 && document.getElementById('f-url').required && !document.getElementById('f-handle').required), 'why has maxlength 140; URL required; handle optional');
    ok(!(await vis(p, 'fallback')), 'fallback is hidden until the first submit');
    await p.close(); }

  // The "What happens next" block, including the deeper-pages line, stays below the fold at 390 and 1280.
  for (const [w, h, mob] of [[390, 844, true], [1280, 800, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
    const p = await ctx.newPage();
    await p.goto(base, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    const pos = await p.evaluate(() => {
      const h2 = document.getElementById('next-h');
      const li = [...document.querySelectorAll('.more ol li')].find((e) => /deeper pages/.test(e.textContent));
      return { h2: h2 ? Math.round(h2.getBoundingClientRect().top) : null, li: li ? Math.round(li.getBoundingClientRect().top) : null, vh: innerHeight };
    });
    ok(pos.h2 != null && pos.h2 >= pos.vh, `"What happens next" is below the ${w} fold (top ${pos.h2}, vh ${pos.vh})`);
    ok(pos.li != null && pos.li >= pos.vh, `deeper-pages line is below the ${w} fold (top ${pos.li}, vh ${pos.vh})`);
    await ctx.close();
  }

  // Input 1: a bad URL. Each bad value is refused, shows an error, opens no mail app.
  { const p = await page(); let allBad = true; const seen = [];
    for (const bad of ['not a url', 'example.com', 'javascript:alert(1)', 'ftp://example.com/', 'mailto:a@b.co', 'https://nodot', 'https://user:pw@example.com/', 'https://', 'x'.repeat(301)]) {
      await p.fill('#f-url', bad); await p.fill('#f-why', 'a fine reason'); await p.click('.go'); await p.waitForTimeout(80);
      const e = await err(p, 'url'), n = (await mails(p)).length, fb = await vis(p, 'fallback');
      seen.push([bad.slice(0, 24), e.t.slice(0, 40)]); if (!(e.t && e.inv === 'true' && n === 0 && !fb)) allBad = false; }
    ok(allBad, 'bad URL (9 variants incl. javascript:, ftp:, mailto:, no scheme, no dot, credentials, too long): error shown, aria-invalid, no mail opened ' + JSON.stringify(seen.slice(0, 3)));
    await p.fill('#f-url', ''); await p.click('.go'); await p.waitForTimeout(60);
    ok((await err(p, 'url')).t === 'Add the link to the site.', 'empty URL: required message');
    ok(await p.evaluate(() => document.activeElement.id === 'f-url'), 'focus goes to the bad field');
    await p.fill('#f-url', 'http://example.com/ok'); await p.waitForTimeout(40);
    ok((await err(p, 'url')).inv === null, 'typing clears the error');
    await p.click('.go'); await p.waitForTimeout(80);
    const m = parse((await mails(p))[0] || ''); ok(m && m.subject === 'Odd site: http://example.com/ok', 'http:// is accepted as well as https://');
    await p.close(); }

  // Input 2: emoji and quotes in the why line, a handle, a URL with a query
  { const p = await page(); const URL_IN = 'https://neal.fun/deep-sea/?x=1&y=a%20b', HANDLE = '@some_maker.99', WHY = 'It\'s a "tiny" museum of 🦆 & ☕ — <b>odd</b> %20 100%';
    await p.fill('#f-url', '  ' + URL_IN + '  '); await p.fill('#f-handle', HANDLE); await p.fill('#f-why', WHY);
    ok((await p.textContent('#why-count')) === WHY.length + ' / 140', 'counter shows the length');
    await p.click('.go'); await p.waitForTimeout(150);
    const ms = await mails(p); ok(ms.length === 1, 'one mail open per submit');
    const href = ms[0] || ''; const m = parse(href);
    ok(/^mailto:smalloddweb@cleverdates\.com\?subject=[A-Za-z0-9%._~-]+&body=[A-Za-z0-9%._~-]+$/.test(href), 'href is plain ASCII and fully percent-encoded (no raw quote, space, emoji or newline)');
    ok(m && m.to === 'smalloddweb@cleverdates.com' && m.subject === 'Odd site: ' + URL_IN, 'subject carries the URL');
    ok(m && m.body === ['Site: ' + URL_IN, "Maker's handle: " + HANDLE, "Why it's odd: " + WHY, '', 'Sent from the Small Odd Web submit page.'].join('\r\n'), 'body carries URL, handle and why (quotes, emoji, ampersand, angle brackets, % all round-trip)');
    ok(/%0D%0A/.test(href), 'line breaks are CRLF-encoded');
    ok(await vis(p, 'fallback'), 'fallback panel is shown after submit');
    ok((await p.textContent('#fb-to')) === 'smalloddweb@cleverdates.com' && (await p.textContent('#fb-subject')) === 'Odd site: ' + URL_IN, 'fallback shows the address and the subject');
    ok((await p.inputValue('#fb-body')).includes("Why it's odd: " + WHY), 'fallback shows the filled message');
    await p.click('#copy'); await p.waitForTimeout(150);
    const clip = await p.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    ok(clip.includes('To: smalloddweb@cleverdates.com') && clip.includes('Subject: Odd site: ' + URL_IN) && clip.includes("Maker's handle: " + HANDLE) && clip.includes("Why it's odd: " + WHY), 'Copy message puts the address, subject and all three fields on the clipboard');
    ok(/Copied/.test(await p.textContent('#copy-status')), 'copy gives a status message');
    await p.click('#open-mail'); await p.waitForTimeout(60); ok((await mails(p)).length === 2 && (await mails(p))[1] === href, '"Open mail app again" uses the same href');
    const stor = await p.evaluate(() => ({ ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie, idb: indexedDB.databases ? 'x' : '' }));
    ok(stor.ls === 0 && stor.ss === 0 && stor.ck === '', 'nothing in localStorage, sessionStorage or cookies after a full submit');
    ok(await p.evaluate(() => !/localStorage|sessionStorage|document\.cookie|XMLHttpRequest|fetch\(|sendBeacon|WebSocket/.test([...document.scripts].map((s) => s.textContent).join('') )) && !(await (await c.request.get(origin + new URL(base).pathname + 'odd.js')).text()).match(/localStorage|sessionStorage|document\.cookie|XMLHttpRequest|fetch\(|sendBeacon|WebSocket|indexedDB/), 'script has no storage, cookie or network APIs');
    // too long: maxlength stops typing at 140; Enter does not add a line
    await p.fill('#f-why', 'x'.repeat(200)); ok((await p.inputValue('#f-why')).length === 140, 'why stops at 140 characters');
    await p.fill('#f-why', 'one'); await p.press('#f-why', 'Enter'); await p.type('#f-why', 'two'); ok((await p.inputValue('#f-why')) === 'onetwo', 'Enter does not add a new line (one line only)');
    await p.fill('#f-why', 'line one\nline two'); await p.waitForTimeout(40); ok((await p.inputValue('#f-why')) === 'line one line two', 'pasted line breaks are flattened');
    await p.close(); }

  // Input 3: missing handle (and missing why)
  { const p = await page();
    await p.fill('#f-url', 'https://crawlerzoo.com/'); await p.fill('#f-why', 'A zoo for web crawlers'); await p.click('.go'); await p.waitForTimeout(120);
    const m = parse((await mails(p))[0] || '');
    ok(m && m.body.includes("Maker's handle: none given") && m.body.includes('Site: https://crawlerzoo.com/') && m.body.includes("Why it's odd: A zoo for web crawlers"), 'missing handle: submits, message says "none given"');
    await p.fill('#f-why', '   '); await p.click('.go'); await p.waitForTimeout(80);
    ok((await err(p, 'why')).t === 'Say in one line why it is odd.' && (await mails(p)).length === 1 && !(await vis(p, 'fallback')), 'missing why: blocked with a message, no mail opened, fallback hidden again');
    await p.fill('#f-why', 'ok'); await p.fill('#f-handle', 'https://x.com/someone'); await p.click('.go'); await p.waitForTimeout(80);
    ok((await err(p, 'handle')).inv === 'true' && (await mails(p)).length === 1, 'a URL in the handle box is refused');
    for (const good of ['@name', 'name.bsky.social', '@name@mastodon.social', 'a_b-c.d']) { await p.fill('#f-handle', good); await p.click('.go'); await p.waitForTimeout(40); }
    ok((await mails(p)).length === 5, '4 handle styles accepted (@name, bsky, mastodon, plain)');
    await p.close(); }

  // Site-level checks
  { const home = await (await c.request.get(origin + '/')).text();
    ok(!/odd-preview/.test(home), 'C2 home does not link /odd-preview/');
    ok(/This domain is for sale\./.test(home) && /afternic\.com\/domain\/cleverdates\.com/.test(home), 'C2 home keeps its for-sale footer');
    const sm = await (await c.request.get(origin + '/sitemap.xml')).text(); ok(!/odd-preview/.test(sm), 'sitemap does not list /odd-preview/');
    const r = await c.request.get(origin + new URL(base).pathname); ok(r.status() === 200 && !/x-robots/i.test(JSON.stringify(r.headers())) , '/odd-preview/ returns 200'); }
  const other = reqs.filter((u) => new URL(u).origin !== origin && !u.startsWith('data:')); ok(other.length === 0, 'no requests leave ' + origin + ' ' + (other.join(',') || ''));
  ok(errs.length === 0, 'no page errors or console errors ' + errs.join('|'));
  await b.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
