// Save card image for /most-common-birthday/. The canvas code is cut from app.js at build time. Nothing is stored or sent.
(() => {
  const { meta, dates } = JSON.parse(document.getElementById('dates').textContent);
  const $ = (s) => document.querySelector(s);
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const num = (n) => n.toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const cur = dates.find((x) => x.rank === 1);
  const sayFor = (x) => 'The most common birthday of all';
  const isLeap = () => false;
  const perYear = (x) => Math.round(x.avg / 4);
  const CANONICAL = 'https://cleverdates.com/most-common-birthday/';
  const isLocalPage = () => location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const publicFooter = () => (isLocalPage() ? CANONICAL : location.origin + location.pathname).replace(/index\.html$/, '').replace(/\/?$/, '/').replace(/^https?:\/\//, '');
  const msg = $('#share-msg');
  const say = (s) => { msg.textContent = s; clearTimeout(msg._t); msg._t = setTimeout(() => (msg.textContent = ''), 4500); };
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

  $('#save').addEventListener('click', async () => deliver(await drawCard(), 'most-common-birthday-' + pad(cur.m) + '-' + pad(cur.d) + '.png', say));
  $('#copy').addEventListener('click', async () => {
    const url = location.origin === 'null' || isLocalPage() ? CANONICAL : location.origin + location.pathname;
    try { await navigator.clipboard.writeText(url); say('Link copied.'); } catch { say('Copy this link: ' + url); }
  });
})();
