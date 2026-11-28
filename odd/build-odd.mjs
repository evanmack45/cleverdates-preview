// Builds the "submit your odd site" preview page into ../docs/odd-preview/ (cleverdates.com/odd-preview/).
// Order: Dash 12:25 PM CT 11/28, playbook 11/28 12:15 PM CT change, BOARD line 91. See odd/LOG.md.
// Called at the end of site-build/build.mjs. It writes only inside docs/odd-preview/ and never touches the C2 home or sitemap.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'docs', 'odd-preview');
const URL_PAGE = 'https://cleverdates.com/odd-preview/';
const TO = 'smalloddweb@cleverdates.com';
const MAXWHY = 140;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'">
<meta name="theme-color" content="#16141c">
<title>Submit an odd site | Small Odd Web</title>
<meta name="description" content="Send Small Odd Web a small, odd website. It opens an email you send yourself.">
<link rel="canonical" href="${URL_PAGE}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2316141c'/%3E%3Crect x='4' y='6' width='24' height='20' rx='2' fill='none' stroke='%23ff6a3d' stroke-width='2'/%3E%3Cpath d='M4 15h24M16 15v11' fill='none' stroke='%23ff6a3d' stroke-width='2'/%3E%3C/svg%3E">
<link rel="preload" href="fonts/fraunces-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/atkinson-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/atkinson-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="odd.css">
</head>
<body>
<header class="top">
 <a class="brand" href="https://x.com/smalloddweb" rel="noopener"><svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="4" width="28" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 14h28M16 14v14" fill="none" stroke="currentColor" stroke-width="2"/></svg>Small Odd Web</a>
 <a class="toplink" href="https://x.com/smalloddweb" rel="noopener">@smalloddweb</a>
</header>
<main>
<div class="wrap">
 <div class="intro">
  <h1>Submit an odd site</h1>
  <p class="lede">Made something small and odd, or found it? Send the link.</p>
  <p class="review">Every submission gets a human review. Nothing is featured automatically.</p>
  <svg class="art" viewBox="0 0 360 250" role="img" aria-label="A drawing of a lopsided browser window with one wide eye and one small eye." focusable="false"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 34c0-7 5-12 12-12h292c7 0 12 5 12 12v182c0 7-5 12-12 12H34c-7 0-12-5-12-12z"/><path d="M22 62h316"/><circle cx="44" cy="42" r="5"/><circle cx="62" cy="42" r="5"/><circle cx="80" cy="42" r="5"/><circle cx="130" cy="130" r="30"/><circle cx="130" cy="130" r="9" fill="currentColor"/><circle cx="238" cy="118" r="13"/><circle cx="240" cy="118" r="4" fill="currentColor"/><path d="M104 192c36 22 92 22 140-6"/><path d="M200 84l30-14M256 82l24 8"/></g></svg>
 </div>
 <div class="card">
  <form id="odd-form" novalidate>
   <div class="field">
    <label for="f-url">Site link</label>
    <input id="f-url" type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="300" placeholder="https://" aria-describedby="e-url" required>
    <p class="err" id="e-url" role="alert"></p>
   </div>
   <div class="field">
    <label for="f-handle">Maker's handle <small>(optional)</small></label>
    <input id="f-handle" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="60" placeholder="@name" aria-describedby="e-handle">
    <p class="err" id="e-handle" role="alert"></p>
   </div>
   <div class="field">
    <label for="f-why">Why it's odd</label>
    <textarea id="f-why" rows="3" maxlength="${MAXWHY}" enterkeyhint="done" autocomplete="off" placeholder="One line." aria-describedby="e-why why-count" required></textarea>
    <div class="row"><p class="err" id="e-why" role="alert"></p><span class="count" id="why-count">0 / ${MAXWHY}</span></div>
   </div>
   <button class="go" type="submit">Email this site</button>
   <p class="fine">Opens your mail app. This page stores nothing.</p>
  </form>
  <noscript><p class="fine">This form needs JavaScript. You can also email ${TO} with the link, the maker's handle if you know it, and one line on why the site is odd.</p></noscript>
  <section class="fallback" id="fallback" aria-labelledby="fb-h" hidden>
   <h2 id="fb-h">No mail app opened?</h2>
   <p>Email this to the address below by hand, or copy it.</p>
   <dl>
    <div><dt>To</dt><dd id="fb-to"></dd></div>
    <div><dt>Subject</dt><dd id="fb-subject"></dd></div>
   </dl>
   <label class="lab" for="fb-body">Message</label>
   <textarea id="fb-body" rows="6" readonly></textarea>
   <div class="btns"><button class="btn primary" type="button" id="copy">Copy message</button><a class="btn" id="open-mail" href="mailto:${TO}">Open mail app again</a></div>
   <p class="status" id="copy-status" role="status" aria-live="polite"></p>
  </section>
 </div>
</div>
<div class="more">
 <section aria-labelledby="next-h">
  <h2 id="next-h">What happens next</h2>
  <ol>
   <li>Your mail app opens with the message filled in. You check it and press send.</li>
   <li>A person reads each submission, then decides what to feature. Nothing is featured automatically.</li>
   <li>Sending a site does not mean it will be featured. We cannot promise a reply.</li>
  </ol>
 </section>
 <section aria-labelledby="pr-h">
  <h2 id="pr-h">What this page does with your answers</h2>
  <p>It puts them into the email in your own mail app. It does not save them, send them, or set cookies. The email goes from you to ${TO}.</p>
 </section>
</div>
</main>
<footer class="foot">
 <p>Small Odd Web posts small, odd sites at <a href="https://x.com/smalloddweb" rel="noopener">@smalloddweb</a> on X.</p>
</footer>
<script src="odd.js" defer></script>
</body>
</html>
`;

mkdirSync(join(out, 'fonts'), { recursive: true });
writeFileSync(join(out, 'index.html'), html);
copyFileSync(join(here, 'src/odd.css'), join(out, 'odd.css'));
copyFileSync(join(here, 'src/odd.js'), join(out, 'odd.js'));
for (const f of readdirSync(join(here, 'src/fonts'))) copyFileSync(join(here, 'src/fonts', f), join(out, 'fonts', f));
console.log(`built ${out}`);
