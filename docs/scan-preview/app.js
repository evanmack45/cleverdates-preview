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
    : x.rank > 183 ? `Rarer than ${Math.min(99, Math.round(((x.rank - 1) / 365) * 100))}% of birthdays`
    : `More common than ${Math.min(99, Math.round(((366 - x.rank) / 365) * 100))}% of birthdays`;
  const isLeap = (x) => x.m === 2 && x.d === 29;
  const perYear = (x) => Math.round(x.avg / 4);
  const noteFor = (x) => isLeap(x)
    ? `Feb 29 is rare because it only happens every 4 years. In a leap year it gets close to a normal day's births. Over 4 years that is about ${num(perYear(x))} a year.`
    : '';
  const card = $('#card');
  const show = (x, { push = true, scroll = false } = {}) => {
    cur = x;
    const mm = pad(x.m) + pad(x.d);
    $('#c-date').textContent = `${MONTHS[x.m - 1]} ${x.d}`;
    $('#c-rank').textContent = x.rank;
    $('#c-say').textContent = sayFor(x);
    $('#c-pin').style.setProperty('--at', ((x.rank - 1) / 365).toFixed(4));
    $('#c-avg').textContent = num(x.avg);
    $('#c-avg').previousElementSibling.textContent = isLeap(x) ? 'Births on Feb 29, per leap year' : `US births on an average ${MONTHS[x.m - 1].slice(0, 3)} ${x.d}`;
    $('#c-leaprow').hidden = !isLeap(x); $('#c-leap').textContent = isLeap(x) ? num(perYear(x)) : '';
    $('#c-mmdd').textContent = mm; $('#c-hit').textContent = mm;
    $('#c-pipos').textContent = num(x.pi);
    $('#c-pre').textContent = x.pre; $('#c-post').textContent = x.post;
    const note = noteFor(x); $('#c-note').textContent = note; $('#c-note').hidden = !note;
    const crowd = $('#c-crowd'); if (crowd) crowd.hidden = x.rank > 60;
    document.querySelectorAll('.g-c.on').forEach((c) => c.classList.remove('on'));
    document.querySelector(`.g-c[data-m="${x.m}"][data-d="${x.d}"]`)?.classList.add('on');
    if (!reduced) { card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); }
    if (push) history.replaceState(null, '', currentHash());
    renderVs();
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
    if (locked) { setFriend(x); return; }
    input.value = `${MONTHS[x.m - 1]} ${x.d}`;
    show(x, { scroll: true });
  });
  document.querySelector('.lists').addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#d="]'); if (!a) return;
    e.preventDefault(); const r = fromHash(a.getAttribute('href'))?.a;
    if (r && locked) { setFriend(r); return; }
    if (r) { input.value = `${MONTHS[r.m - 1]} ${r.d}`; show(r, { scroll: true }); }
  });

  // ---------- hash ----------
  const key = (x) => `${pad(x.m)}-${pad(x.d)}`;
  const dateOf = (t) => { const m = /^(\d{2})-(\d{2})$/.exec(t); if (!m) return null; const mo = Number(m[1]), d = Number(m[2]); return mo >= 1 && mo <= 12 && d >= 1 && d <= DIM[mo - 1] ? find(mo, d) : null; };
  // #d=MM-DD (one date), #d=MM-DD&vs= (challenge: sender's date, friend's still empty), #d=MM-DD&vs=MM-DD (both).
  // Returns { a, vs } or null. vs is undefined (absent), '' (empty), a date row, or null (present but not a real date).
  const fromHash = (h) => {
    const m = /^#d=(\d{2}-\d{2})(?:&vs=([^&]{0,24}))?$/.exec(h);
    const a = m && dateOf(m[1]);
    if (!a) return null;
    return { a, vs: m[2] === undefined ? undefined : m[2] === '' ? '' : dateOf(m[2]) };
  };
  const load = () => {
    if (!location.hash) return;
    const h = fromHash(location.hash);
    if (!h) { help.textContent = 'That link has no valid date. Type one above.'; help.classList.add('bad'); return; }
    locked = h.vs !== undefined;
    friend = h.vs && h.vs !== null ? h.vs : null;
    input.value = `${MONTHS[h.a.m - 1]} ${h.a.d}`;
    show(h.a, { push: false });
    vsIn.value = friend ? `${MONTHS[friend.m - 1]} ${friend.d}` : '';
    if (h.vs === null) setVsHelp('The friend date in that link is not a real date. Type yours.', true);
  };
  addEventListener('hashchange', load);

  // ---------- share ----------
  // Switch to https://cleverdates.com/ at go-live.
  const CANONICAL = 'https://cleverdates.com/';
  const isLocalPage = () => location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const publicPage = () => CANONICAL; // preview copy: shares and links always go to the home
  const publicLink = (hash) => `${publicPage()}${hash.startsWith('#') ? hash : '#' + hash}`;
  const publicFooter = (hash) => publicLink(hash).replace(/^https?:\/\//, '');
  const msg = $('#share-msg');
  const sayIn = (el, s) => { el.textContent = s; clearTimeout(el._t); el._t = setTimeout(() => (el.textContent = ''), 4500); };
  const say = (s) => sayIn(msg, s);
  $('#copy').addEventListener('click', async () => {
    const hash = `#d=${key(cur)}`;
    const url = publicLink(hash);
    history.replaceState(null, '', currentHash());
    try { await navigator.clipboard.writeText(url); say('Link copied. It holds the month and day only.'); }
    catch { say('Copy this link: ' + url); }
  });
  let candleP = null, bandP = null, crowdP = null;
  const loadImg = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  const candleArt = () => candleP || (candleP = loadImg('../art/candle-360.webp'));
  const bandArt = () => bandP || (bandP = loadImg('../art/result-band-819.webp'));
  const crowdArt = () => crowdP || (crowdP = loadImg('../art/crowd-1024.webp'));
  // green ground, cream paper and Dash's candle-field band across the top (type stays on plain cream below it)
  const frame = async (g, W, H) => {
    g.fillStyle = '#0f3b2c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f6efe0'; g.beginPath(); g.roundRect(48, 48, W - 96, H - 96, 36); g.fill();
    const band = await bandArt();
    g.save(); g.beginPath(); g.roundRect(48, 48, W - 96, H - 96, 36); g.clip();
    if (band) g.drawImage(band, 0, 0, band.width, Math.round(band.width * 198 / 984), 48, 48, W - 96, 198);
    else { g.fillStyle = '#e3d9bf'; g.fillRect(48, 48, W - 96, 198); }
    g.fillStyle = '#0f3b2c'; g.fillRect(48, 246, W - 96, 3);
    g.restore();
  };
  const drawCard = async () => {
    await Promise.all([document.fonts.load('120px Gloock'), document.fonts.load('600 40px Schibsted'), document.fonts.load('400 30px Schibsted')]);
    const W = 1080, H = 1350, P = 84, k = 1;
    const cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k;
    const g = cv.getContext('2d');
    const ink = '#0f3b2c', coral = '#e0502c', paper = '#f6efe0', soft = '#46665a';
    await frame(g, W, H);
    g.fillStyle = ink; g.textBaseline = 'alphabetic';
    g.font = '600 34px Schibsted, sans-serif'; g.fillText('How rare is your birthday?', P + 20, 306);
    g.font = '96px Gloock, serif'; g.fillText(`${MONTHS[cur.m - 1]} ${cur.d}`, P + 20, 406);
    g.fillStyle = coral; g.font = '300px Gloock, serif';
    const rk = String(cur.rank); g.fillText(rk, P + 10, 656);
    const rw = g.measureText(rk).width;
    const common = cur.rank <= 60;
    const art = common ? await crowdArt() : await candleArt();
    g.fillStyle = ink; g.font = '600 44px Schibsted, sans-serif'; g.fillText('of 366', P + 30 + rw, 656);
    // side art shrinks rather than touch "of 366" on three-digit ranks; crowd is square, the lonely candle is taller
    const ofEnd = P + 30 + rw + g.measureText('of 366').width;
    const maxW = Math.max(120, Math.min(common ? 240 : 200, W - P - 20 - (ofEnd + 18)));
    const cw = maxW, ch = common ? maxW : Math.round((cw * 267) / 200), cx = W - P - 20 - cw, cy = 663 - ch;
    if (art) { g.save(); g.beginPath(); g.roundRect(cx, cy, cw, ch, 18); g.clip(); g.drawImage(art, cx, cy, cw, ch); g.restore(); }
    g.font = '500 44px Schibsted, sans-serif'; g.fillText(sayFor(cur), P + 20, 734);
    // meter
    const mx = P + 20, mw = W - 2 * (P + 20), my = 790;
    for (let i = 0; i < 6; i++) { g.fillStyle = ['#1d5c47', '#3f7a4f', '#7a9a55', '#c9a24a', '#ec8045', '#ff5e3a'][i]; g.fillRect(mx + (mw / 6) * i, my, mw / 6 - 4, 22); }
    const px = mx + mw * ((cur.rank - 1) / 365);
    g.fillStyle = ink; g.beginPath(); g.moveTo(px, my - 6); g.lineTo(px - 14, my - 30); g.lineTo(px + 14, my - 30); g.fill();
    g.font = '400 28px Schibsted, sans-serif'; g.fillStyle = soft; g.fillText('most common', mx, my + 56); g.textAlign = 'right'; g.fillText('rarest', mx + mw, my + 56); g.textAlign = 'left';
    g.fillStyle = ink;
    if (isLeap(cur)) {
      g.font = '400 32px Schibsted, sans-serif';
      g.fillText(`${num(cur.avg)} US babies on Feb 29, per leap year`, P + 20, 906);
      g.fillText(`It only happens every 4 years, so about ${num(perYear(cur))} a year`, P + 20, 950);
      g.fillText(`An average day gets ${num(meta.avgDay)}`, P + 20, 994);
    } else {
      g.font = '400 36px Schibsted, sans-serif';
      g.fillText(`${num(cur.avg)} US babies on an average ${MONTHS[cur.m - 1].slice(0, 3)} ${cur.d}`, P + 20, 922);
      g.fillText(`${num(meta.avgDay)} on an average day`, P + 20, 970);
    }
    // pi
    g.fillStyle = ink; g.fillRect(P + 20, 1022, W - 2 * (P + 20), 2);
    g.font = '600 36px Schibsted, sans-serif'; g.fillText(`In pi, ${pad(cur.m)}${pad(cur.d)} first shows up at digit ${num(cur.pi)}`, P + 20, 1080);
    g.font = '64px Gloock, serif'; let x = P + 20;
    const seg = (t, c) => { g.fillStyle = c; g.fillText(t, x, 1160); x += g.measureText(t).width; };
    seg('…' + cur.pre, soft); seg(pad(cur.m) + pad(cur.d), coral); seg(cur.post + '…', soft);
    g.fillStyle = soft; g.font = '400 24px Schibsted, sans-serif';
    g.fillText(`US births ${meta.years}: SSA via FiveThirtyEight, CC BY 4.0. Averaged and ranked.`, P + 20, 1228);
    g.fillText(publicFooter(`#d=${pad(cur.m)}-${pad(cur.d)}`), P + 20, 1262);
    return cv;
  };
  const deliver = async (cv, name, tell) => {
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const file = new File([blob], name, { type: 'image/png' });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; } catch { /* fall back to download */ }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    tell('Card saved.');
  };
  $('#save').addEventListener('click', async () => deliver(await drawCard(), `birthday-${pad(cur.m)}-${pad(cur.d)}.png`, say));

  // ---------- you vs a friend ----------
  // State is two month-day pairs in the URL hash. No names, no years, nothing stored or sent.
  // locked: the page was opened from a link that carries "&vs=", so the sender's date can't be edited here.
  let friend = null, locked = false;
  const vsIn = $('#vswhen'), vsHelp = $('#vs-help'), vsOut = $('#vs-out'), hero = $('.hero');
  const VS_HELP = vsHelp.textContent;
  const currentHash = () => `#d=${key(cur)}` + (friend ? `&vs=${key(friend)}` : locked ? '&vs=' : '');
  const nameOf = (x) => `${MONTHS[x.m - 1]} ${x.d}`;
  const shortSay = (x) => x.rank === 1 ? 'Most common of all' : x.rank === 366 ? 'Rarest of all'
    : x.rank > 183 ? `Rarer than ${Math.min(99, Math.round(((x.rank - 1) / 365) * 100))}%` : `More common than ${Math.min(99, Math.round(((366 - x.rank) / 365) * 100))}%`;
  const gapText = () => {
    if (friend.rank === cur.rank) return 'Same birthday, same rank.';
    const [hi, lo] = friend.rank > cur.rank ? [friend, cur] : [cur, friend];
    return `${nameOf(hi)} is the rarer one, ${hi.rank - lo.rank} place${hi.rank - lo.rank === 1 ? '' : 's'} apart.`;
  };
  const setVsHelp = (t, bad) => { vsHelp.textContent = t; vsHelp.classList.toggle('bad', !!bad); if (bad) vsIn.setAttribute('aria-invalid', 'true'); else vsIn.removeAttribute('aria-invalid'); };
  const LOCK_HELP = 'Their date is locked. Add yours in the box below.';
  const renderVs = () => {
    hero.classList.toggle('locked', locked);
    input.readOnly = locked;
    $('#pick button').hidden = locked;
    $('#pick label').textContent = locked ? 'Sent to you (locked)' : 'Month and day, no year';
    if (locked) { help.textContent = LOCK_HELP; help.classList.remove('bad'); input.removeAttribute('aria-invalid'); }
    else if (help.textContent === LOCK_HELP) help.textContent = HELP;
    $('#vs-h').textContent = locked ? 'Now yours?' : 'You vs a friend';
    $('#vs-dek').textContent = locked ? 'A friend sent you their date. Add yours to see both ranks.' : "Type a friend's month and day to see whose birthday is rarer, or send them a challenge link.";
    $('#vs-label').textContent = locked ? 'Your month and day, no year' : 'Their month and day, no year';
    vsIn.placeholder = locked ? 'July 4' : 'Dec 25';
    $('#vs-unlock').hidden = !locked;
    $('#vs-chal').hidden = locked;
    $('#vs-save').hidden = $('#vs-copy').hidden = !friend;
    vsOut.hidden = !friend;
    if (!friend) return;
    $('#vs-a-who').textContent = locked ? 'Sent to you' : 'Your date'; $('#vs-b-who').textContent = locked ? 'You' : 'Friend';
    for (const [id, x] of [['a', cur], ['b', friend]]) {
      $(`#vs-${id}-d`).textContent = nameOf(x); $(`#vs-${id}-r`).textContent = x.rank; $(`#vs-${id}-s`).textContent = shortSay(x);
      $(`#vs-pin-${id}`).style.setProperty('--at', ((x.rank - 1) / 365).toFixed(4));
    }
    $('#vs-gap').textContent = gapText();
  };
  const setFriend = (x) => {
    friend = x; vsIn.value = nameOf(x); setVsHelp(VS_HELP, false);
    history.replaceState(null, '', currentHash());
    renderVs();
  };
  $('#vsform').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = parse(vsIn.value);
    if (r.error) { setVsHelp(r.error, true); return; }
    setFriend(find(r.m, r.d));
  });
  vsIn.addEventListener('input', () => { if (vsIn.hasAttribute('aria-invalid')) setVsHelp(VS_HELP, false); });
  const vsay = (s) => sayIn($('#vs-msg'), s);
  const copyText = async (url, ok) => { try { await navigator.clipboard.writeText(url); vsay(ok); } catch { vsay('Copy this link: ' + url); } };
  $('#vs-chal').addEventListener('click', () => {
    const hash = `#d=${key(cur)}&vs=`;
    copyText(publicLink(hash), 'Challenge link copied. Your friend sees your date and types theirs. Only dates are in it.');
  });
  $('#vs-copy').addEventListener('click', () => {
    history.replaceState(null, '', currentHash());
    copyText(publicLink(currentHash()), 'Link copied. It holds two month-days and nothing else.');
  });
  $('#vs-unlock').addEventListener('click', () => {
    locked = false; friend = null; vsIn.value = ''; setVsHelp(VS_HELP, false);
    history.replaceState(null, '', currentHash());
    renderVs(); input.focus();
  });

  // The two-date PNG: same frame as the single card, two columns, one shared meter.
  const drawPair = async () => {
    await Promise.all([document.fonts.load('120px Gloock'), document.fonts.load('600 40px Schibsted'), document.fonts.load('400 30px Schibsted')]);
    const W = 1080, H = 1350, P = 84;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const ink = '#0f3b2c', coral = '#e0502c', cinkb = '#b83a18', soft = '#46665a';
    await frame(g, W, H);
    g.fillStyle = ink; g.textBaseline = 'alphabetic';
    g.font = '600 34px Schibsted, sans-serif'; g.fillText('Two birthdays, ranked', P + 20, 306);
    const colW = 416, xs = [P + 20, P + 20 + colW + 40];
    // neutral tags: the PNG is read by people who were not in the conversation
    const cols = [[cur, 'First date', ink], [friend, 'Second date', cinkb]];
    const fit = (txt, font, max, start) => { let n = start; do { g.font = font(n); n -= 2; } while (g.measureText(txt).width > max && n > 24); };
    for (let i = 0; i < 2; i++) {
      const [x, tag, col] = cols[i], cx = xs[i];
      g.fillStyle = col; g.beginPath(); g.roundRect(cx, 340, 22, 22, 5); g.fill();
      g.fillStyle = soft; g.font = '600 30px Schibsted, sans-serif'; g.fillText(tag, cx + 34, 362);
      g.fillStyle = ink; fit(nameOf(x), (n) => `${n}px Gloock, serif`, colW, 64); g.fillText(nameOf(x), cx, 440);
      g.fillStyle = coral; fit(String(x.rank), (n) => `${n}px Gloock, serif`, colW - 28, 220); g.fillText(String(x.rank), cx - 4, 640);
      g.fillStyle = ink; g.font = '600 40px Schibsted, sans-serif'; g.fillText('of 366', cx, 690);
      g.font = '500 34px Schibsted, sans-serif'; g.fillText(shortSay(x), cx, 744);
      const common = x.rank <= 60, art = common ? await crowdArt() : await candleArt();
      const aw = common ? 160 : 120, ah = 160;
      if (art) { g.save(); g.beginPath(); g.roundRect(cx, 772, aw, ah, 16); g.clip(); g.drawImage(art, cx, 772, aw, ah); g.restore(); }
    }
    // shared meter: first date's pin above the bar, second date's below
    const mx = P + 20, mw = W - 2 * (P + 20), my = 1010;
    for (let i = 0; i < 6; i++) { g.fillStyle = ['#1d5c47', '#3f7a4f', '#7a9a55', '#c9a24a', '#ec8045', '#ff5e3a'][i]; g.fillRect(mx + (mw / 6) * i, my, mw / 6 - 4, 22); }
    const pa = mx + mw * ((cur.rank - 1) / 365), pb = mx + mw * ((friend.rank - 1) / 365);
    g.fillStyle = ink; g.beginPath(); g.moveTo(pa, my - 6); g.lineTo(pa - 14, my - 30); g.lineTo(pa + 14, my - 30); g.fill();
    g.fillStyle = cinkb; g.beginPath(); g.moveTo(pb, my + 28); g.lineTo(pb - 14, my + 52); g.lineTo(pb + 14, my + 52); g.fill();
    g.font = '400 28px Schibsted, sans-serif'; g.fillStyle = soft; g.fillText('most common', mx, my + 96); g.textAlign = 'right'; g.fillText('rarest', mx + mw, my + 96); g.textAlign = 'left';
    g.fillStyle = ink; g.font = '600 40px Schibsted, sans-serif'; g.fillText(gapText(), mx, 1156);
    if (isLeap(cur) || isLeap(friend)) { g.font = '400 28px Schibsted, sans-serif'; g.fillStyle = soft; g.fillText('Feb 29 is rare because it only happens every 4 years.', mx, 1190); }
    g.fillStyle = soft; g.font = '400 24px Schibsted, sans-serif';
    g.fillText(`US births ${meta.years}: SSA via FiveThirtyEight, CC BY 4.0. Averaged and ranked.`, P + 20, 1228);
    g.fillText(publicFooter(currentHash()), P + 20, 1262);
    return cv;
  };
  $('#vs-save').addEventListener('click', async () => deliver(await drawPair(), `birthdays-${key(cur)}-vs-${key(friend)}.png`, vsay));

  // ---------- billion-second day (Foil's C1 fold-in; year never leaves this box) ----------
  const bout = $('#bout');
  $('#bform').addEventListener('submit', (e) => {
    e.preventDefault();
    tout.textContent = '';
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
    const [prev, next] = twins(y);
    tout.textContent = `Calendar twins: ${prev} and ${next} have the same calendar as ${y}. Every date lands on the same weekday${leapY(y) ? ', Feb 29 included' : ''}.`;
  });
  $('#byear').addEventListener('input', () => { tout.textContent = ''; });

  // ---------- calendar twins (Foil's C5 fold-in): same Jan 1 weekday and same leap status ----------
  const tout = $('#tout');
  const leapY = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const jan1 = (y) => new Date(Date.UTC(y, 0, 1)).getUTCDay();
  const same = (a, b) => jan1(a) === jan1(b) && leapY(a) === leapY(b);
  function twins(y) {
    let p = y - 1, n = y + 1;
    while (!same(p, y)) p--;
    while (!same(n, y)) n++;
    return [p, n];
  }
  window.__twins = twins;

  load();
  renderVs();
})();
