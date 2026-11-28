// /scan-preview/ layer on top of app.js (unchanged ids): month and day buttons, the sticky rank bar and its Share.
// app.js owns the state and the hash; this file only feeds it a date and mirrors the shown date. Nothing is stored or sent.
(() => {
  const { dates } = JSON.parse(document.getElementById('dates').textContent);
  const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const find = (m, d) => dates.find((x) => x.m === m && x.d === d);
  const shade = (rank) => Math.min(5, Math.floor(((rank - 1) / 366) * 6));
  const months = $$('.mo'), days = $$('.dy');
  let m = 7, d = 4;
  const paint = () => {
    for (const b of months) b.setAttribute('aria-pressed', String(Number(b.dataset.m) === m));
    for (const b of days) {
      const n = Number(b.dataset.d), x = n <= DIM[m - 1] ? find(m, n) : null;
      b.className = 'dy' + (x ? ` s${shade(x.rank)}` : '');
      b.disabled = !x; b.setAttribute('aria-pressed', String(!!x && n === d));
      if (x) b.setAttribute('aria-label', `${MONTHS[m - 1]} ${n}, no. ${x.rank} of 366`); else b.removeAttribute('aria-label');
    }
  };
  // Feed a date to app.js: your date normally; the friend's date when a challenge link has locked yours.
  const pick = () => {
    const txt = `${MONTHS[m - 1]} ${d}`;
    if (document.querySelector('.hero.locked')) { $('#vswhen').value = txt; $('#vsform').requestSubmit(); return; }
    $('#when').value = txt; $('#pick').requestSubmit();
  };
  $('#mpick').addEventListener('click', (e) => { const b = e.target.closest('.mo'); if (!b) return; m = Number(b.dataset.m); d = Math.min(d, DIM[m - 1]); paint(); pick(); });
  $('#dpick').addEventListener('click', (e) => { const b = e.target.closest('.dy'); if (!b || b.disabled) return; d = Number(b.dataset.d); paint(); pick();
    // Challenge: the comparison sits under the pickers; bring it up once the friend taps a day (not on a month tap).
    if (document.querySelector('.hero.locked') && !$('#vs-out').hidden) {
      const phone = getComputedStyle($('#sbar')).display !== 'none'; // phone: put the typable box and its hint at the top, above the result, clear of the rank bar
      (phone ? $('#vsform') : $('#vs-out')).scrollIntoView({ block: phone ? 'start' : 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  });
  // Mirror whatever app.js shows (typed date, grid tap, list link, hash) into the buttons and the bar.
  const sync = () => {
    const t = /^([A-Z][a-z]+) (\d{1,2})$/.exec($('#c-date').textContent.trim()); if (!t) return;
    const mm = MONTHS.indexOf(t[1]) + 1, dd = Number(t[2]);
    if (!document.querySelector('.hero.locked')) { m = mm; d = dd; paint(); }
    $('#sb-d').textContent = `${t[1]} ${dd}`; $('#sb-r').textContent = $('#c-rank').textContent;
  };
  new MutationObserver(sync).observe($('#card'), { subtree: true, childList: true, characterData: true });
  sync();
  // Challenge link (locked hero): the pickers (one #toy) become the friend's input. They sit under the locked date and the "Now yours?" heading,
  // above the typable box, so all 43 buttons stay in the first screen (Shears cut 2, 11/27).
  const toy = $('#toy'), ask = toy.parentElement, anchor = toy, parts = [toy];
  const home = document.createComment('pickers'); ask.insertBefore(home, anchor);
  const place = () => {
    const lockedNow = !!document.querySelector('.hero.locked'), form = $('#vsform');
    if (lockedNow && form && parts[0].parentElement === ask) { $('#vs-h').after(...parts); if (!$('#vswhen').value) $$('.mo, .dy').forEach((x) => x.setAttribute('aria-pressed', 'false')); }
    else if (!lockedNow && parts[0].parentElement !== ask) home.after(...parts);
  };
  new MutationObserver(place).observe($('.hero'), { attributes: true, attributeFilter: ['class'] });
  place();
  // Header "Sources" opens the collapsed About the data block.
  const openData = () => { const dt = $('#data details'); if (dt) dt.open = true; };
  // (preventDefault: app.js reads every hash change as a date link and would flag #data as a bad date)
  $$('a[href="#data"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openData(); $('#data').scrollIntoView({ block: 'start' }); }));
  if (location.hash === '#data') openData();
  // Bar Share = the card's own Save card image (share sheet on phones, download elsewhere).
  $('#sb-share').addEventListener('click', () => $('#save').click());

  // Phone sticky bar height -> padding so the typed-date row can clear it.
  const setSbarPad = () => {
    const bar = $('#sbar');
    const on = bar && getComputedStyle(bar).display !== 'none';
    document.documentElement.style.setProperty('--sbar-h', on ? Math.ceil(bar.getBoundingClientRect().height) + 'px' : '0px');
  };
  setSbarPad();
  addEventListener('resize', setSbarPad);

})();
