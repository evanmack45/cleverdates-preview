// How rare is your birthday: month/day in, rank card out. Nothing is stored or sent.
(() => {
  const { meta, dates } = JSON.parse(document.getElementById('dates').textContent);
  const $ = (s) => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const num = (n) => n.toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const find = (m, d) => dates.find((x) => x.m === m && x.d === d);
  let cur = find(7, 4);

  // ---------- parsing ----------
  const MONTH_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?$/;
  const monthOf = (w) => { const m = MONTH_RE.exec(w); return m ? ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(m[1]) + 1 : 0; };
  const dayOf = (w) => { const m = /^(\d{1,2})(st|nd|rd|th)?,?$/.exec(w); return m ? Number(m[1]) : 0; };
  // Returns { m, d } or { error }
  const parse = (raw) => {
    const s = String(raw).toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!s) return { error: 'Type a month and day, like July 4.' };
    let m = 0, d = 0;
    const words = s.replace(/\bof\b/g, ' ').replace(/,/g, ' ').split(' ').filter(Boolean);
    const mw = words.findIndex((w) => monthOf(w));
    if (mw >= 0) {
      m = monthOf(words[mw]);
      const dw = words.find((w, i) => i !== mw && dayOf(w));
      d = dw ? dayOf(dw) : 0;
      if (!d) return { error: `Which day in ${MONTHS[m - 1]}? Try ${MONTHS[m - 1]} 1.` };
    } else {
      const n = /^(\d{1,2})\s*[/.\-\s]\s*(\d{1,2})(?:\s*[/.\-\s]\s*\d{2,4})?$/.exec(s) || /^(\d{2})(\d{2})$/.exec(s);
      if (!n) return { error: 'That does not look like a date. Try July 4 or 7/4.' };
      let a = Number(n[1]), b = Number(n[2]);
      if (a > 12 && b <= 12) [a, b] = [b, a]; // 25/12 means Dec 25
      m = a; d = b;
    }
    if (m < 1 || m > 12) return { error: 'Months go from 1 to 12. Try 7/4.' };
    if (d < 1 || d > DIM[m - 1]) return { error: `${MONTHS[m - 1]} has only ${DIM[m - 1]} days.` };
    return { m, d };
  };

  // ---------- card ----------
  const sayFor = (x) => x.rank === 1 ? 'The most common birthday of all'
    : x.rank === 366 ? 'The rarest birthday of all'
    : x.rank > 183 ? `Rarer than ${Math.round(((x.rank - 1) / 365) * 100)}% of birthdays`
    : `More common than ${Math.round(((366 - x.rank) / 365) * 100)}% of birthdays`;
  const noteFor = (x) => x.m === 2 && x.d === 29
    ? 'February 29 comes once every four years. Counted over whole years, it is the rarest birthday of all: about 1 day in 1,461.'
    : x.rank > 356 ? 'Holidays rank low because fewer births are scheduled on them.' : '';
  const card = $('#card');
  const show = (x, { push = true, scroll = false } = {}) => {
    cur = x;
    const mm = pad(x.m) + pad(x.d);
    $('#c-date').textContent = `${MONTHS[x.m - 1]} ${x.d}`;
    $('#c-rank').textContent = x.rank;
    $('#c-say').textContent = sayFor(x);
    $('#c-pin').style.setProperty('--at', ((x.rank - 1) / 365).toFixed(4));
    $('#c-avg').textContent = num(x.avg);
    $('#c-avg').previousElementSibling.textContent = `US births on an average ${MONTHS[x.m - 1].slice(0, 3)} ${x.d}`;
    $('#c-mmdd').textContent = mm; $('#c-hit').textContent = mm;
    $('#c-pipos').textContent = num(x.pi);
    $('#c-pre').textContent = x.pre; $('#c-post').textContent = x.post;
    const note = noteFor(x); $('#c-note').textContent = note; $('#c-note').hidden = !note;
    document.querySelectorAll('.g-c.on').forEach((c) => c.classList.remove('on'));
    document.querySelector(`.g-c[data-m="${x.m}"][data-d="${x.d}"]`)?.classList.add('on');
    if (!reduced) { card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); }
    if (push) history.replaceState(null, '', `#d=${pad(x.m)}-${pad(x.d)}`);
    if (scroll) { const r = card.getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * 0.6) card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
    bout.textContent = '';
  };

  // ---------- input ----------
  const input = $('#when'), help = $('#when-help');
  const HELP = help.textContent;
  $('#pick').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = parse(input.value);
    if (r.error) { help.textContent = r.error; input.setAttribute('aria-invalid', 'true'); help.classList.add('bad'); return; }
    input.removeAttribute('aria-invalid'); help.classList.remove('bad'); help.textContent = HELP;
    show(find(r.m, r.d));
  });
  input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); help.classList.remove('bad'); help.textContent = HELP; } });
  $('#grid').addEventListener('click', (e) => {
    const c = e.target.closest('.g-c[data-m]');
    if (!c) return;
    const x = find(Number(c.dataset.m), Number(c.dataset.d));
    input.value = `${MONTHS[x.m - 1]} ${x.d}`;
    show(x, { scroll: true });
  });
  document.querySelector('.lists').addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#d="]'); if (!a) return;
    e.preventDefault(); const r = fromHash(a.getAttribute('href'));
    if (r) { input.value = `${MONTHS[r.m - 1]} ${r.d}`; show(r, { scroll: true }); }
  });

  // ---------- hash ----------
  const fromHash = (h) => { const m = /^#d=(\d{2})-(\d{2})$/.exec(h); if (!m) return null; const mo = Number(m[1]), d = Number(m[2]); return mo >= 1 && mo <= 12 && d >= 1 && d <= DIM[mo - 1] ? find(mo, d) : null; };
  const load = () => {
    if (!location.hash) return;
    const x = fromHash(location.hash);
    if (x) { input.value = `${MONTHS[x.m - 1]} ${x.d}`; show(x, { push: false }); }
    else { help.textContent = 'That link has no valid date. Type one above.'; help.classList.add('bad'); }
  };
  addEventListener('hashchange', load);

  // ---------- share ----------
  const msg = $('#share-msg');
  const say = (s) => { msg.textContent = s; clearTimeout(say.t); say.t = setTimeout(() => (msg.textContent = ''), 4500); };
  $('#copy').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#d=${pad(cur.m)}-${pad(cur.d)}`;
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); say('Link copied. It holds the month and day only.'); }
    catch { say('Copy this link: ' + url); }
  });
  const drawCard = async () => {
    await Promise.all([document.fonts.load('120px Gloock'), document.fonts.load('600 40px Schibsted'), document.fonts.load('400 30px Schibsted')]);
    const W = 1080, H = 1350, P = 84, k = 1;
    const cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k;
    const g = cv.getContext('2d');
    const ink = '#0f3b2c', coral = '#e0502c', paper = '#f6efe0', soft = '#46665a';
    g.fillStyle = '#0f3b2c'; g.fillRect(0, 0, W, H);
    g.fillStyle = paper; g.beginPath(); g.roundRect(48, 48, W - 96, H - 96, 36); g.fill();
    g.fillStyle = ink; g.textBaseline = 'alphabetic';
    g.font = '600 34px Schibsted, sans-serif'; g.fillText('How rare is your birthday?', P + 20, 150);
    g.font = '96px Gloock, serif'; g.fillText(`${MONTHS[cur.m - 1]} ${cur.d}`, P + 20, 270);
    g.fillStyle = coral; g.font = '300px Gloock, serif';
    const rk = String(cur.rank); g.fillText(rk, P + 10, 560);
    const rw = g.measureText(rk).width;
    g.fillStyle = ink; g.font = '600 44px Schibsted, sans-serif'; g.fillText('of 366', P + 30 + rw, 560);
    g.font = '500 44px Schibsted, sans-serif'; g.fillText(sayFor(cur), P + 20, 650);
    // meter
    const mx = P + 20, mw = W - 2 * (P + 20), my = 710;
    for (let i = 0; i < 6; i++) { g.fillStyle = ['#1d5c47', '#3f7a4f', '#7a9a55', '#c9a24a', '#ec8045', '#ff5e3a'][i]; g.fillRect(mx + (mw / 6) * i, my, mw / 6 - 4, 22); }
    const px = mx + mw * ((cur.rank - 1) / 365);
    g.fillStyle = ink; g.beginPath(); g.moveTo(px, my - 6); g.lineTo(px - 14, my - 30); g.lineTo(px + 14, my - 30); g.fill();
    g.font = '400 28px Schibsted, sans-serif'; g.fillStyle = soft; g.fillText('most common', mx, my + 60); g.textAlign = 'right'; g.fillText('rarest', mx + mw, my + 60); g.textAlign = 'left';
    g.fillStyle = ink; g.font = '400 36px Schibsted, sans-serif';
    g.fillText(`${num(cur.avg)} US babies on an average ${MONTHS[cur.m - 1].slice(0, 3)} ${cur.d}`, P + 20, 860);
    g.fillText(`${num(meta.avgDay)} on an average day`, P + 20, 910);
    // pi
    g.fillStyle = ink; g.fillRect(P + 20, 970, W - 2 * (P + 20), 2);
    g.font = '600 36px Schibsted, sans-serif'; g.fillText(`In pi, ${pad(cur.m)}${pad(cur.d)} first shows up at digit ${num(cur.pi)}`, P + 20, 1040);
    g.font = '64px Gloock, serif'; let x = P + 20;
    const seg = (t, c) => { g.fillStyle = c; g.fillText(t, x, 1130); x += g.measureText(t).width; };
    seg('…' + cur.pre, soft); seg(pad(cur.m) + pad(cur.d), coral); seg(cur.post + '…', soft);
    g.fillStyle = soft; g.font = '400 24px Schibsted, sans-serif';
    g.fillText(`US births ${meta.years}: SSA via FiveThirtyEight, CC BY 4.0. Averaged and ranked.`, P + 20, 1215);
    g.fillText(location.host + location.pathname.replace(/index\.html$/, '') + `#d=${pad(cur.m)}-${pad(cur.d)}`, P + 20, 1250);
    return cv;
  };
  $('#save').addEventListener('click', async () => {
    const cv = await drawCard();
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const name = `birthday-${pad(cur.m)}-${pad(cur.d)}.png`;
    const file = new File([blob], name, { type: 'image/png' });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; } catch { /* fall back to download */ }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    say('Card saved.');
  });

  // ---------- billion-second day (Foil's C1 fold-in; year never leaves this box) ----------
  const bout = $('#bout');
  $('#bform').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = $('#byear').value.trim();
    const now = new Date();
    if (!/^\d{4}$/.test(raw)) { bout.textContent = 'Type a four-digit year, like 1994.'; return; }
    const y = Number(raw);
    if (y < 1900 || y > now.getFullYear()) { bout.textContent = `Pick a year from 1900 to ${now.getFullYear()}.`; return; }
    if (cur.m === 2 && cur.d === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) { bout.textContent = `${y} had no February 29.`; return; }
    const birth = new Date(y, cur.m - 1, cur.d);
    if (birth > now) { bout.textContent = 'That day has not happened yet.'; return; }
    const at = new Date(birth.getTime() + 1e9 * 1000);
    const when = at.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    bout.textContent = at > now ? `You turn one billion seconds old on ${when}, give or take a day for the hour you were born.` : `You turned one billion seconds old on ${when}, give or take a day for the hour you were born.`;
  });

  load();
})();
