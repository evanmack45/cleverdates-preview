// "Submit your odd site": builds a pre-filled mailto: from three fields. Nothing is stored or sent by this page:
// no storage, no cookies, no network requests. The visitor's own mail app sends the email.
(() => {
  'use strict';
  const TO = 'smalloddweb@cleverdates.com';
  const MAX = { url: 300, handle: 60, why: 140, href: 2000 };

  const clean = (s) => String(s).replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim();

  function checkUrl(raw) {
    const s = clean(raw);
    if (!s) return { err: 'Add the link to the site.' };
    if (/\s/.test(s)) return { err: 'A link has no spaces in it.' };
    if (s.length > MAX.url) return { err: 'That link is too long. Use the shortest one that opens the site.' };
    let u;
    try { u = new URL(s); } catch { return { err: 'That is not a full link. Start it with https://' }; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { err: 'Use a link that starts with http:// or https://' };
    if (u.username || u.password) return { err: 'Take the name and password out of the link.' };
    if (!u.hostname.includes('.') || u.hostname.endsWith('.')) return { err: 'That web address looks incomplete. Check it and try again.' };
    return { value: u.href };
  }

  function checkHandle(raw) {
    const s = clean(raw);
    if (!s) return { value: '' };
    if (s.length > MAX.handle) return { err: 'That handle is too long.' };
    if (!/^@?[A-Za-z0-9._-]+(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})?$/.test(s)) return { err: 'Use only the handle, like @name. Letters, numbers, dots, dashes and underscores.' };
    return { value: s };
  }

  function checkWhy(raw) {
    const s = clean(raw);
    if (!s) return { err: 'Say in one line why it is odd.' };
    if (s.length > MAX.why) return { err: 'Keep it to ' + MAX.why + ' characters.' };
    return { value: s };
  }

  const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

  function compose(url, handle, why) {
    const subject = 'Odd site: ' + url;
    const body = ['Site: ' + url, "Maker's handle: " + (handle || 'none given'), "Why it's odd: " + why, '', 'Sent from the Small Odd Web submit page.'].join('\r\n');
    const href = 'mailto:' + TO + '?subject=' + enc(subject) + '&body=' + enc(body);
    return { to: TO, subject, body, href };
  }

  const $ = (id) => document.getElementById(id);
  const form = $('odd-form');
  if (!form) return;
  const f = { url: $('f-url'), handle: $('f-handle'), why: $('f-why') };
  const e = { url: $('e-url'), handle: $('e-handle'), why: $('e-why') };
  const count = $('why-count');
  const panel = $('fallback');
  const open = $('open-mail');
  const status = $('copy-status');

  const showErr = (k, msg) => {
    e[k].textContent = msg || '';
    if (msg) f[k].setAttribute('aria-invalid', 'true'); else f[k].removeAttribute('aria-invalid');
  };
  const updateCount = () => { count.textContent = clean(f.why.value).length + ' / ' + MAX.why; };

  // One line only: Enter does not add a new line in the "why" box.
  f.why.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ev.preventDefault(); });
  f.why.addEventListener('input', () => {
    const flat = f.why.value.replace(/[\r\n]+/g, ' ');
    if (flat !== f.why.value) f.why.value = flat;
    updateCount();
    if (f.why.getAttribute('aria-invalid')) showErr('why', '');
  });
  f.url.addEventListener('input', () => { if (f.url.getAttribute('aria-invalid')) showErr('url', ''); });
  f.handle.addEventListener('input', () => { if (f.handle.getAttribute('aria-invalid')) showErr('handle', ''); });
  updateCount();

  let current = null;
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    status.textContent = '';
    const u = checkUrl(f.url.value), h = checkHandle(f.handle.value), w = checkWhy(f.why.value);
    showErr('url', u.err); showErr('handle', h.err); showErr('why', w.err);
    const bad = ['url', 'handle', 'why'].find((k) => ({ url: u, handle: h, why: w })[k].err);
    if (bad) { panel.hidden = true; f[bad].focus(); return; }
    const m = compose(u.value, h.value, w.value);
    if (m.href.length > MAX.href) { showErr('why', 'Too long once it is written into an email. Shorten the link or the line.'); f.why.focus(); return; }
    current = m;
    $('fb-to').textContent = m.to;
    $('fb-subject').textContent = m.subject;
    $('fb-body').value = m.body.replace(/\r\n/g, '\n');
    open.setAttribute('href', m.href);
    panel.hidden = false;
    open.click();
  });

  $('copy').addEventListener('click', async () => {
    if (!current) return;
    const text = 'To: ' + current.to + '\nSubject: ' + current.subject + '\n\n' + current.body.replace(/\r\n/g, '\n');
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied. Paste it into a new email.';
    } catch {
      const ta = $('fb-body');
      ta.focus(); ta.select();
      status.textContent = 'Select the text above and copy it by hand.';
    }
  });
})();
