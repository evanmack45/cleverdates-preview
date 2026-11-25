// Builds docs/ from data/dates.json. No dependencies.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'docs');
const { meta, dates } = JSON.parse(readFileSync(join(here, 'data/dates.json'), 'utf8'));
const SITE = 'https://evanmack45.github.io/cleverdates-preview/';
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

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
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
</section>

<section class="map" aria-labelledby="map-h">
 <h2 id="map-h">Every birthday, ranked</h2>
 <p class="map-dek">Darker squares are more common. Brighter squares are rarer. Tap one.</p>
 <div class="grid" id="grid" role="grid" aria-label="Calendar of all 366 birthdays shaded by how common they are. Use the text box above to pick a date.">${gridHTML}</div>
 <div class="key" aria-hidden="true"><span>more common</span>${[0, 1, 2, 3, 4, 5].map((i) => `<i class="g-c s${i}"></i>`).join('')}<span>rarer</span></div>
 <div class="lists">
  <div><h3>Most common</h3><ol>${extremes.slice(0, 5).map((x, i) => listItem(x, i)).join('')}</ol></div>
  <div><h3>Rarest</h3><ol>${extremes.slice(-5).reverse().map((x, i) => listItem(x, i)).join('')}</ol></div>
  <figure class="rare-art"><img src="art/candle-360.webp" srcset="art/candle-360.webp 360w, art/candle-640.webp 640w" sizes="(min-width: 900px) 240px, 60vw" width="640" height="853" loading="lazy" decoding="async" alt="Risograph print: one tall pink birthday candle burns alone on a wide teal plain under a pale sun."></figure>
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

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'fonts'), { recursive: true });
mkdirSync(join(out, 'data'), { recursive: true });
writeFileSync(join(out, 'index.html'), html);
for (const f of ['style.css', 'app.js', 'og.jpg']) { copyFileSync(join(here, 'src', f), join(out, f)); }
mkdirSync(join(out, 'art'), { recursive: true });
for (const f of readdirSync(join(here, 'src/art'))) copyFileSync(join(here, 'src/art', f), join(out, 'art', f));
for (const f of readdirSync(join(here, 'src/fonts'))) copyFileSync(join(here, 'src/fonts', f), join(out, 'fonts', f));
copyFileSync(join(here, 'data/dates.json'), join(out, 'data/dates.json'));
copyFileSync(join(here, 'data/LICENSE-fivethirtyeight-CC-BY-4.0.txt'), join(out, 'data/LICENSE-fivethirtyeight-CC-BY-4.0.txt'));
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(out, '.nojekyll'), '');
console.log(`built ${out}: 366 dates, example ${EX.m}/${EX.d} rank ${EX.rank}`);
