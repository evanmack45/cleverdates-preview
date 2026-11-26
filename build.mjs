// Builds docs/ from data/dates.json. No dependencies.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'docs');
const { meta, dates } = JSON.parse(readFileSync(join(here, 'data/dates.json'), 'utf8'));
const SITE = 'https://cleverdates.com/';
const AFTERNIC = 'https://www.afternic.com/domain/cleverdates.com';
const SOURCE = 'https://github.com/fivethirtyeight/data/tree/master/births';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Boundary checks
if (dates.length !== 366) throw new Error('need 366 dates');
const ranks = new Set();
for (const d of dates) {
  if (!(d.m >= 1 && d.m <= 12 && d.d >= 1 && d.d <= DIM[d.m - 1])) throw new Error(`bad date ${d.m}/${d.d}`);
  if (!(d.avg > 0 && d.rank >= 1 && d.rank <= 366 && d.pi > 0 && d.pi < meta.piDigits)) throw new Error(`bad row ${d.m}/${d.d}`);
  if (!/^\d{0,6}$/.test(d.pre) || !/^\d{6}$/.test(d.post)) throw new Error(`bad pi context ${d.m}/${d.d}`);
  ranks.add(d.rank);
}
if (ranks.size !== 366) throw new Error('ranks not unique');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => n.toLocaleString('en-US');
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const byKey = (m, d) => dates.find((x) => x.m === m && x.d === d);
// 5 shades: rank 1 (most common) .. 366 (rarest)
const shade = (rank) => Math.min(5, Math.floor(((rank - 1) / 366) * 6));

const EX = byKey(7, 4);
const FEB29 = byKey(2, 29);
const cardHTML = (x) => `
 <p class="c-date" id="c-date">${MONTHS[x.m - 1]} ${x.d}</p>
 <p class="c-rank"><span class="c-hash">No.</span><span id="c-rank">${x.rank}</span><span class="c-of">of 366</span></p>
 <img class="c-crowd" id="c-crowd" src="art/crowd-480.webp" srcset="art/crowd-480.webp 480w, art/crowd-1024.webp 1024w" sizes="(min-width: 900px) 240px, 45vw" width="1024" height="1024" alt="A crowd of lit birthday candles packed side by side." loading="lazy" decoding="async" hidden>
 <p class="c-say" id="c-say">${x.rank > 183 ? `Rarer than ${num(Math.round(((x.rank - 1) / 365) * 100))}% of birthdays` : `More common than ${num(Math.round(((366 - x.rank) / 365) * 100))}% of birthdays`}</p>
 <div class="c-meter" aria-hidden="true"><span class="c-pin" id="c-pin" style="--at:${((x.rank - 1) / 365).toFixed(4)}"></span></div><div class="c-ends" aria-hidden="true"><span>most common</span><span>rarest</span></div>
 <dl class="c-facts">
  <div><dt>US births on an average ${MONTHS[x.m - 1].slice(0, 3)} ${x.d}</dt><dd id="c-avg">${num(x.avg)}</dd></div>
  <div id="c-leaprow" hidden><dt>Per year, over 4 years</dt><dd id="c-leap"></dd></div>
  <div><dt>On an average day of the year</dt><dd>${num(meta.avgDay)}</dd></div>
 </dl>
 <div class="c-pi">
  <p class="c-pi-head">In pi, <b id="c-mmdd">${String(x.m).padStart(2, '0')}${String(x.d).padStart(2, '0')}</b> first shows up at digit <b id="c-pipos">${num(x.pi)}</b></p>
  <p class="c-digits" aria-hidden="true"><span class="c-dots">…</span><span id="c-pre">${x.pre}</span><mark id="c-hit">${String(x.m).padStart(2, '0')}${String(x.d).padStart(2, '0')}</mark><span id="c-post">${x.post}</span><span class="c-dots">…</span></p>
 </div>
 <p class="c-note" id="c-note" hidden></p>`;

const gridHTML = Array.from({ length: 12 }, (_, mi) => `<div class="g-row" role="row"><span class="g-m" role="rowheader">${MONTHS[mi].slice(0, 3)}</span>${Array.from({ length: 31 }, (_, di) => {
  const x = byKey(mi + 1, di + 1);
  return x ? `<span class="g-c s${shade(x.rank)}${x === EX ? ' on' : ''}" role="gridcell" data-m="${x.m}" data-d="${x.d}" title="${MONTHS[mi].slice(0, 3)} ${x.d}: no. ${x.rank}"></span>` : '<span class="g-c none" role="gridcell"></span>';
}).join('')}</div>`).join('');

const extremes = [...dates].sort((a, b) => a.rank - b.rank);
const listItem = (x, i) => `<li><span class="n">${i + 1}</span><a href="#d=${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}">${MONTHS[x.m - 1].slice(0, 3)} ${x.d}</a> <span class="v">${num(x.avg)} a day</span></li>`;

const attribution = `Birth data: <a href="${SOURCE}" rel="noopener">FiveThirtyEight, U.S. Births</a>, from the Social Security Administration, ${meta.years}. <a href="${LICENSE}" rel="noopener">CC BY 4.0</a>. Changed: averaged by month and day, then ranked.`;

const LD = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Clever Dates', url: SITE, description: 'Type a month and day. See how common that birthday is in the US, out of 366, and where it first shows up in pi.', applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
const ldTag = `<script type="application/ld+json">${JSON.stringify(LD).replace(/</g, '\\u003c')}</script>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${SITE}">
<meta property="og:url" content="${SITE}">
<title>How rare is your birthday? | Clever Dates</title>
<meta name="description" content="Type a month and day. See how common that birthday is in the US, out of 366, and where it first shows up in pi.">
<meta property="og:title" content="How rare is your birthday?">
<meta property="og:description" content="Your birthday's rank out of 366, and where it hides in pi.">
<meta property="og:image" content="${SITE}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A slice of birthday cake with one lit candle inside a ring of small unlit candles, risograph style.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
${ldTag}
<link rel="preload" href="fonts/gloock.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/schibsted.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="art/candles-800.webp" imagesrcset="art/candles-800.webp 800w, art/candles-1400.webp 1400w" imagesizes="(min-width: 900px) 600px, 100vw" fetchpriority="high">
<link rel="stylesheet" href="style.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%230f3b2c'/%3E%3Crect x='9' y='9' width='5' height='5' fill='%23ff7a59'/%3E%3C/svg%3E">
<script>document.documentElement.className='js'</script>
</head>
<body>
<header class="bar"><a class="mark" href="./">Clever Dates</a><nav aria-label="Page"><a href="#data">About the data</a></nav></header>
<main>
<section class="hero" aria-labelledby="h1">
 <div class="ask">
  <figure class="hero-art"><img src="art/candles-800.webp" srcset="art/candles-800.webp 800w, art/candles-1400.webp 1400w" sizes="(min-width: 900px) 600px, 100vw" width="1400" height="547" fetchpriority="high" alt="Risograph print: a field of tiny unlit teal birthday candles with four glowing pink lit ones, one much brighter than the rest."></figure>
  <h1 id="h1">How rare is your birthday?</h1>
  <form class="pick" id="pick" role="search" action="#" novalidate>
   <label for="when">Month and day, no year</label>
   <div class="pick-row"><input id="when" name="when" type="text" autocomplete="off" spellcheck="false" maxlength="24" placeholder="July 4" value="July 4" aria-describedby="when-help"><button type="submit">Show me</button></div>
   <p class="help" id="when-help" role="status">Try 7/4, Dec 25 or 29 Feb. It stays in your browser.</p>
  </form>
 </div>
 <article class="card" id="card" aria-live="polite" aria-labelledby="c-date"><img class="c-band" src="art/result-band-410.webp" srcset="art/result-band-410.webp 410w, art/result-band-819.webp 819w" sizes="(min-width: 900px) 520px, 100vw" width="819" height="230" alt="" decoding="async">${cardHTML(EX)}
  <p class="c-src">US births ${meta.years}, SSA via FiveThirtyEight, CC BY 4.0</p>
 </article>
 <div class="share">
  <button type="button" id="save">Save card image</button>
  <button type="button" id="copy">Copy link</button>
  <p id="share-msg" role="status"></p>
 </div>
 <section class="vs" id="vs" aria-labelledby="vs-h">
  <h2 id="vs-h">You vs a friend</h2>
  <p class="vs-dek" id="vs-dek">Type a friend's month and day to see whose birthday is rarer, or send them a challenge link.</p>
  <form class="pick" id="vsform" action="#" novalidate>
   <label for="vswhen" id="vs-label">Their month and day, no year</label>
   <div class="pick-row"><input id="vswhen" name="vswhen" type="text" autocomplete="off" spellcheck="false" maxlength="24" placeholder="Dec 25" aria-describedby="vs-help"><button type="submit">Compare</button></div>
   <p class="help" id="vs-help" role="status">Try 12/25 or Sept 12. Nothing is saved.</p>
  </form>
  <div class="vs-out" id="vs-out" aria-live="polite" hidden>
   <div class="vs-tiles">
    <div class="vs-tile"><p class="vs-who"><i class="k a" aria-hidden="true"></i><span id="vs-a-who">Your date</span></p><p class="vs-d" id="vs-a-d"></p><p class="vs-r"><b id="vs-a-r"></b><span>of 366</span></p><p class="vs-s" id="vs-a-s"></p></div>
    <div class="vs-tile"><p class="vs-who"><i class="k b" aria-hidden="true"></i><span id="vs-b-who">Friend</span></p><p class="vs-d" id="vs-b-d"></p><p class="vs-r"><b id="vs-b-r"></b><span>of 366</span></p><p class="vs-s" id="vs-b-s"></p></div>
   </div>
   <div class="c-meter vs-meter" aria-hidden="true"><span class="c-pin" id="vs-pin-a"></span><span class="c-pin b" id="vs-pin-b"></span></div>
   <p class="vs-gap" id="vs-gap"></p>
  </div>
  <div class="vs-btns">
   <button type="button" id="vs-save" hidden>Save two-date card</button>
   <button type="button" id="vs-copy" hidden>Copy comparison link</button>
   <button type="button" id="vs-chal">Copy challenge link</button>
   <button type="button" id="vs-unlock" hidden>Check my own date instead</button>
   <p id="vs-msg" role="status"></p>
  </div>
 </section>
</section>

<section class="map" aria-labelledby="map-h">
 <h2 id="map-h">Every birthday, ranked</h2>
 <p class="map-dek">Darker squares are more common. Brighter squares are rarer. Tap one.</p>
 <div class="grid" id="grid" role="grid" aria-label="Calendar of all 366 birthdays shaded by how common they are. Use the text box above to pick a date.">${gridHTML}</div>
 <div class="key" aria-hidden="true"><span>more common</span>${[0, 1, 2, 3, 4, 5].map((i) => `<i class="g-c s${i}"></i>`).join('')}<span>rarer</span></div>
 <div class="lists">
  <div><h3>Most common</h3><ol>${extremes.slice(0, 5).map((x, i) => listItem(x, i)).join('')}</ol>
   <figure class="crowd-art"><img src="art/crowd-480.webp" srcset="art/crowd-480.webp 480w, art/crowd-1024.webp 1024w" sizes="(min-width: 900px) 240px, 45vw" width="1024" height="1024" loading="lazy" decoding="async" alt="A crowd of lit birthday candles packed side by side."></figure></div>
  <div><h3>Rarest</h3><ol>${extremes.slice(-5).reverse().map((x, i) => listItem(x, i)).join('')}</ol>
   <figure class="rare-art"><img src="art/candle-360.webp" srcset="art/candle-360.webp 360w, art/candle-640.webp 640w" sizes="(min-width: 900px) 240px, 60vw" width="640" height="853" loading="lazy" decoding="async" alt="Risograph print: one tall pink birthday candle burns alone on a wide teal plain under a pale sun."></figure></div>
 </div>
</section>

<section class="billion" aria-labelledby="b-h">
 <details id="bdetails">
  <summary><span id="b-h">Show my billion-second day and calendar twins</span></summary>
  <p>Add a birth year to see the day you turn one billion seconds old, and the closest years before and after with the exact same calendar. The year stays on this page. It is not added to your link or your card.</p>
  <form id="bform" class="pick-row" action="#" novalidate>
   <label class="sr" for="byear">Birth year</label>
   <input id="byear" type="text" inputmode="numeric" maxlength="4" placeholder="1994" autocomplete="off">
   <button type="submit">Count</button>
  </form>
  <p id="bout" role="status"></p>
  <p id="tout" role="status"></p>
 </details>
</section>

<section class="data" id="data" aria-labelledby="data-h">
 <h2 id="data-h">About the data</h2>
 <p>The rank uses ${num(meta.days)} days of US births, ${meta.years}, ${num(meta.births)} babies in all. For each month and day we take the average number of births on that date, then rank the 366 dates from most common (no. 1) to rarest (no. 366). Holidays rank low because fewer births are scheduled on them.</p>
 <p>February 29 is rare because it only happens every 4 years. It is ranked by its births per leap year, ${num(FEB29.avg)} on average, which is close to the ${num(meta.avgDay)} on an average day. Spread over the 4 years it takes to come around, that is ${num(FEB29.avg)} divided by 4, about ${num(Math.round(FEB29.avg / 4))} births a year, under a quarter of what an average date gets each year.</p>
 <p>Pi digits: the first ${num(meta.piDigits)} decimal digits, computed for this page with <a href="https://mpmath.org/" rel="noopener">mpmath</a> and checked with a second method. We look for the month and day as four digits, so July 4 is 0704.</p>
 <p class="attr">${attribution}</p>
 <p class="attr">Illustrations made with an AI image model (Nano Banana Pro). No real people are shown.</p>
</section>
</main>
<footer class="foot"><p><a href="${AFTERNIC}" rel="noopener">This domain is for sale.</a></p></footer>
<script type="application/json" id="dates">${JSON.stringify({ meta, dates }).replace(/</g, '\\u003c')}</script>
<script src="app.js" defer></script>
</body>
</html>`;


// ---- /rarest-birthday/: one answer page, built from the same data ----
const RB = SITE + 'rarest-birthday/';
const rare = [...dates].sort((a, b) => b.rank - a.rank);
const top = rare[0], r2 = rare[1], r3 = rare[2];
const common = [...dates].sort((a, b) => a.rank - b.rank);
const dn = (x) => `${MONTHS[x.m - 1]} ${x.d}`;
const pctRarer = Math.round(((FEB29.rank - 1) / 365) * 100);
const answer = `No. February 29 is no. ${FEB29.rank} of 366, rarer than ${pctRarer}% of birthdays. The rarest is ${dn(top)}, no. ${top.rank}, with ${num(top.avg)} US births on an average day. ${dn(r2)} is next, then ${dn(r3)}.`;
if (answer.split(/\s+/).length > 60) throw new Error('first answer over 60 words');
if (top.rank !== 366 || FEB29.rank >= 366) throw new Error('rarest page claim does not match data');
const rbRows = [...rare.slice(0, 5), FEB29].map((x) => `<li${x === FEB29 ? ' class="me"' : ''}><span class="n">${x.rank}</span><span class="d">${dn(x)}</span><span class="v">${num(x.avg)} a day${x === FEB29 ? ', per leap year' : ''}</span></li>`).join('');
const RBLD = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Is February 29 the rarest birthday?', url: RB, description: `No. February 29 ranks ${FEB29.rank} of 366 for US births. The rarest birthday is ${dn(top)}.`, isPartOf: { '@type': 'WebSite', name: 'Clever Dates', url: SITE } };
const rbHTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${RB}">
<meta property="og:url" content="${RB}">
<title>Is February 29 the rarest birthday? | Clever Dates</title>
<meta name="description" content="No. February 29 is no. ${FEB29.rank} of 366 for US births. The rarest birthday is ${dn(top)}.">
<meta property="og:title" content="Is February 29 the rarest birthday?">
<meta property="og:description" content="No. The rarest birthday is ${dn(top)}, no. ${top.rank} of 366.">
<meta property="og:image" content="${SITE}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A slice of birthday cake with one lit candle inside a ring of small unlit candles, risograph style.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(RBLD)}</script>
<link rel="preload" href="../fonts/gloock.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../fonts/schibsted.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../style.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%230f3b2c'/%3E%3Crect x='9' y='9' width='5' height='5' fill='%23ff7a59'/%3E%3C/svg%3E">
</head>
<body>
<header class="bar"><a class="mark" href="../">Clever Dates</a><nav aria-label="Page"><a href="../">Check yours</a></nav></header>
<main class="rb">
 <figure class="hero-art"><img src="../art/candles-800.webp" srcset="../art/candles-800.webp 800w, ../art/candles-1400.webp 1400w" sizes="(min-width: 900px) 600px, 100vw" width="1400" height="547" fetchpriority="high" alt="Risograph print: a field of tiny unlit teal birthday candles with four glowing pink lit ones, one much brighter than the rest."></figure>
 <h1>Is February 29 the rarest birthday?</h1>
 <p class="rb-a" id="rb-answer">${answer}</p>
 <ol class="rb-list" aria-label="The five rarest birthdays, and February 29">${rbRows}</ol>
 <p class="rb-note">February 29 comes every 4 years, so it feels rare. Counted by births per day, it is not.</p>
 <p class="rb-note"><a class="rb-x" href="../most-common-birthday/">At the other end, the most common is ${dn(common[0])}</a></p>
 <p><a class="rb-go" href="../">Check your birthday</a></p>
 <p class="attr">${attribution}</p>
</main>
<footer class="foot"><p><a href="${AFTERNIC}" rel="noopener">This domain is for sale.</a></p></footer>
</body>
</html>`;

// ---- /most-common-birthday/: one answer page, same data, same card art, same PNG code as the home ----
const MC = SITE + 'most-common-birthday/';
const c1 = common[0], c2 = common[1], c3 = common[2];
const upPct = Math.round((c1.avg / meta.avgDay - 1) * 100);
const mcAnswer = `${dn(c1)} is the most common birthday in the US, no. ${c1.rank} of 366. It averages ${num(c1.avg)} births a day, ${upPct}% above the ${num(meta.avgDay)} of an average date. ${dn(c2)} and ${dn(c3)} come next.`;
if (mcAnswer.split(/\s+/).length > 60) throw new Error('mc first answer over 60 words');
if (c1.rank !== 1 || c1.m !== 9 || c1.d !== 12) throw new Error('most-common page claim does not match data');
const sepInTen = common.slice(0, 10).filter((x) => x.m === 9).length;
const decInTen = common.slice(0, 10).filter((x) => x.m === 12).length;
const mcRows = common.slice(0, 5).map((x) => `<li${x === c1 ? ' class="me"' : ''}><span class="n">${x.rank}</span><span class="d">${dn(x)}</span><span class="v">${num(x.avg)} a day</span></li>`).join('');
const mcCard = `<article class="card mc-card" id="card" aria-labelledby="c-date"><img class="c-band" src="../art/result-band-410.webp" srcset="../art/result-band-410.webp 410w, ../art/result-band-819.webp 819w" sizes="(min-width: 900px) 720px, 100vw" width="819" height="230" alt="" decoding="async">${cardHTML(c1).replace('src="art/crowd-480.webp" srcset="art/crowd-480.webp 480w, art/crowd-1024.webp 1024w"', 'src="../art/crowd-480.webp" srcset="../art/crowd-480.webp 480w, ../art/crowd-1024.webp 1024w"').replace(/ loading="lazy"/, '').replace(/ hidden>/, '>').replace(/More common than \d+% of birthdays/, 'The most common birthday of all').replace(/\n <p class="c-note"[^\n]*/, '').replace(/ <div id="c-leaprow" hidden>[^\n]*\n/, '')}
  <p class="c-src">US births ${meta.years}, SSA via FiveThirtyEight, CC BY 4.0</p>
 </article>`;
const MCLD = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'What is the most common birthday?', url: MC, description: `${dn(c1)} is the most common birthday in the US, no. 1 of 366, with ${num(c1.avg)} births on an average day.`, isPartOf: { '@type': 'WebSite', name: 'Clever Dates', url: SITE } };
// The share-card code is cut out of src/app.js (loadImg .. drawCard, deliver) so the PNG on this page can never drift from the home's.
const appSrc = readFileSync(join(here, 'src/app.js'), 'utf8');
const cutA = appSrc.indexOf('let candleP = null'), cutB = appSrc.indexOf('  const deliver = async');
const cutC = appSrc.indexOf('\n  };\n', cutB) + 6;
if (cutA < 0 || cutB < cutA || cutC < cutB) throw new Error('share-card code not found in app.js');
const mcJS = `// Save card image for /most-common-birthday/. The canvas code is cut from app.js at build time. Nothing is stored or sent.
(() => {
  const { meta, dates } = JSON.parse(document.getElementById('dates').textContent);
  const $ = (s) => document.querySelector(s);
  const MONTHS = ${JSON.stringify(MONTHS)};
  const num = (n) => n.toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const cur = dates.find((x) => x.rank === 1);
  const sayFor = (x) => 'The most common birthday of all';
  const isLeap = () => false;
  const perYear = (x) => Math.round(x.avg / 4);
  const CANONICAL = 'https://cleverdates.com/most-common-birthday/';
  const isLocalPage = () => location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const publicFooter = () => (isLocalPage() ? CANONICAL : location.origin + location.pathname).replace(/index\\.html$/, '').replace(/\\/?$/, '/').replace(/^https?:\\/\\//, '');
  const msg = $('#share-msg');
  const say = (s) => { msg.textContent = s; clearTimeout(msg._t); msg._t = setTimeout(() => (msg.textContent = ''), 4500); };
${appSrc.slice(cutA, cutC).replace(/'art\//g, "'../art/")}
  $('#save').addEventListener('click', async () => deliver(await drawCard(), 'most-common-birthday-' + pad(cur.m) + '-' + pad(cur.d) + '.png', say));
  $('#copy').addEventListener('click', async () => {
    const url = location.origin === 'null' || isLocalPage() ? CANONICAL : location.origin + location.pathname;
    try { await navigator.clipboard.writeText(url); say('Link copied.'); } catch { say('Copy this link: ' + url); }
  });
})();
`;
const mcHTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${MC}">
<meta property="og:url" content="${MC}">
<title>What is the most common birthday? | Clever Dates</title>
<meta name="description" content="${dn(c1)} is the most common birthday in the US: no. 1 of 366, with ${num(c1.avg)} births on an average day.">
<meta property="og:title" content="What is the most common birthday?">
<meta property="og:description" content="${dn(c1)}, no. 1 of 366, with ${num(c1.avg)} US births on an average day.">
<meta property="og:image" content="${SITE}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A slice of birthday cake with one lit candle inside a ring of small unlit candles, risograph style.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(MCLD)}</script>
<link rel="preload" href="../fonts/gloock.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../fonts/schibsted.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../style.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%230f3b2c'/%3E%3Crect x='9' y='9' width='5' height='5' fill='%23ff7a59'/%3E%3C/svg%3E">
<script>document.documentElement.className='js'</script>
</head>
<body>
<header class="bar"><a class="mark" href="../">Clever Dates</a><nav aria-label="Page"><a href="../">Check yours</a></nav></header>
<main class="rb mc">
 <h1>What is the most common birthday?</h1>
 <p class="rb-a" id="rb-answer">${mcAnswer}</p>
 ${mcCard}
 <div class="share">
  <button type="button" id="save">Save card image</button>
  <button type="button" id="copy">Copy link</button>
  <p id="share-msg" role="status"></p>
 </div>
 <ol class="rb-list" aria-label="The five most common birthdays">${mcRows}</ol>
 <p class="rb-note">${['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'][sepInTen]} of the 10 most common dates are in September, and ${['zero','one','two','three','four','five','six','seven','eight','nine','ten'][decInTen]} are in December.</p>
 <p class="rb-note"><a class="rb-x" href="../rarest-birthday/">At the other end, the rarest is ${dn(top)}</a></p>
 <p><a class="rb-go" href="../">Check your birthday</a></p>
 <p class="attr">${attribution}</p>
</main>
<footer class="foot"><p><a href="${AFTERNIC}" rel="noopener">This domain is for sale.</a></p></footer>
<script type="application/json" id="dates">${JSON.stringify({ meta, dates: [c1] }).replace(/</g, '\\u003c')}</script>
<script src="../mc.js" defer></script>
</body>
</html>`;

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'fonts'), { recursive: true });
mkdirSync(join(out, 'data'), { recursive: true });
writeFileSync(join(out, 'index.html'), html);
mkdirSync(join(out, 'rarest-birthday'), { recursive: true });
writeFileSync(join(out, 'rarest-birthday/index.html'), rbHTML);
mkdirSync(join(out, 'most-common-birthday'), { recursive: true });
writeFileSync(join(out, 'most-common-birthday/index.html'), mcHTML);
writeFileSync(join(out, 'mc.js'), mcJS);
for (const f of ['style.css', 'app.js', 'og.jpg']) { copyFileSync(join(here, 'src', f), join(out, f)); }
mkdirSync(join(out, 'art'), { recursive: true });
for (const f of readdirSync(join(here, 'src/art'))) copyFileSync(join(here, 'src/art', f), join(out, 'art', f));
for (const f of readdirSync(join(here, 'src/fonts'))) copyFileSync(join(here, 'src/fonts', f), join(out, 'fonts', f));
copyFileSync(join(here, 'data/dates.json'), join(out, 'data/dates.json'));
copyFileSync(join(here, 'data/LICENSE-fivethirtyeight-CC-BY-4.0.txt'), join(out, 'data/LICENSE-fivethirtyeight-CC-BY-4.0.txt'));
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}</loc></url><url><loc>${RB}</loc></url><url><loc>${MC}</loc></url></urlset>\n`);
writeFileSync(join(out, 'CNAME'), 'cleverdates.com\n');
writeFileSync(join(out, '.nojekyll'), '');
console.log(`built ${out}: 366 dates, example ${EX.m}/${EX.d} rank ${EX.rank}`);
