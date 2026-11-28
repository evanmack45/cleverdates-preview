# Small Odd Web gallery (/small-odd-web/) LOG

## 2026-11-28 go-live (Dash YES, 1:37 PM CT)

Live URL: https://cleverdates.com/small-odd-web/

Built from the Shears-PASS preview at db4add6 (gallery of seven queue sites), with:

- Kit form 10255637 (double opt-in) moved under the lede "Seven sites, newest first." and above the first card at every width. Heading collapsed to one line: "One email a week, five odd sites." Robot-check notice kept ("You may get a quick I'm-not-a-robot check."). Weekly-unsubscribe line dropped as a duplicate. Guard redirect in js/signup.js unchanged. Form not submitted from this work.
- "Submit your odd site" links to Gizmo's form at https://cleverdates.com/odd-preview/ (the page that builds mailto:smalloddweb@cleverdates.com).
- noindex, nofollow kept, because /odd-preview/ is still noindex. Not added to the sitemap. Canonical, og:url, and og:image are absolute https://cleverdates.com/small-odd-web/ URLs.
- For-sale footer matches other cleverdates.com pages: "This domain is for sale." → https://www.afternic.com/domain/cleverdates.com
- C2 home, rarest, most-common, /odd-preview/, sitemap, and robots.txt were not edited. build.mjs gained only a post-build hook so a C2 rebuild will recopy this folder after it wipes docs/.

The GitHub Pages preview repo evanmack45/small-odd-web-preview is left as it was (de605d3, content db4add6, Shears PASS) and is superseded by this live URL.

Local measure (gate-1128-sow2.js method) before deploy: fold prose 21/21 at 390 and 1280 (bar ≤35). Main taps 48px, 0 fails. Numeric hero (visible a.hero in the fold) still ≥0.35 at both widths because the Enfilade shot starts mid-fold (0.436 at 390, 0.449 at 1280). QUALITY-BAR v1.4 also wants the first 390 screen to be one headline, one support line, one control, and nothing else; the form-first layout conflicts with that "nothing else" rule even when the hero ratio clears. Dash's priority was the form first; noted for Shears.

Live verification, shots, and visual-qa-gate: see the later update in this file after Pages builds.

## 2026-11-28 ~1:48 PM CT live verification

https://cleverdates.com/small-odd-web/ returns 200 over HTTPS. Pages build d95ab9f is `built`, https_enforced true. No-slash URL 301s to the trailing slash. og:url is that live URL (200). og:image https://cleverdates.com/small-odd-web/img/og.jpg returns 200 (image/jpeg, 108373 bytes).

Live measure (same method as gate-1128-sow2.js): fold prose 21/21 at 390 and 1280. Main taps 48px, 0 fails. Hero visible-box ratio 0.436 at 390, 0.449 at 1280.

visual-qa-gate (URL positional) PASS, no P0. Lighthouse mobile: performance 91, accessibility 100, best-practices 100, seo 69. LCP 1.2s, CLS 0.176 (P1, budget 0.1), TBT 100ms. SEO is pulled down by noindex, matching /odd-preview/. Gate out: /workspace/mason/sow-golive-live-2026-11-28/gate. Own 390/1280 fold and full shots: /workspace/mason/sow-golive-live-2026-11-28/. Kit form was not submitted.

## 2026-11-28 ~1:55 PM CT: CLS fix (Dash 1:50 PM CT)

Source of the 0.176 shift, from Lighthouse `layout-shifts` / `cls-culprits-insight` and a PerformanceObserver trace: not the Kit form and not unsized images (unsized-images score 1). Almost all of the 0.176 was `img.hero-shot` moving when `fraunces-700.woff2` and `atkinson-400.woff2` swapped in (`font-display: swap`). On a 412px Lighthouse viewport the fallback text was wide enough that "Get the list" wrapped under the email field, then jumped up beside it once Atkinson loaded, which shoved the hero up ~58px (y 476 → 418). A 0.0002 leftover was `@smalloddweb` changing width.

Fix: metric-matched fallback `@font-face` faces (`size-adjust` / `ascent-override` / `descent-override`), same pattern as C2's Gloock/Schibsted fallbacks, plus preload of Fraunces 700 and Atkinson 400/700. Form-first layout, copy, robot line, and guard redirect unchanged. Form not submitted. build.mjs hook left intact.

Local check with fonts delayed 800ms: vertical positions of the form and hero match the loaded-font layout; CLS 0.001 (tiny residual button/toplink width). Fold prose still 21/21, taps 48px, hero 0.436 / 0.449.

Live Lighthouse median and shots: see the next entry after Pages builds.

## 2026-11-28 ~1:55 PM CT live CLS verification (commit cc29eec)

https://cleverdates.com/small-odd-web/ is serving the fallback CSS and font preloads. Lighthouse mobile, three runs with the same flags as visual-qa-gate: CLS 0, 0, 0; median 0 (was 0.176). Performance 100 / a11y 100 / best-practices 100 / seo 69 (noindex) on all three; LCP 1.2s. JSON: /workspace/mason/sow-golive-live-2026-11-28/lh-clsfix-{1,2,3}.json.

visual-qa-gate (URL positional) PASS, no P0, and its own Lighthouse mobile also CLS 0, performance 100, LCP 1.2s, TBT 0ms. Out: /workspace/mason/sow-golive-live-2026-11-28/gate-clsfix. Live fold prose 21/21, taps 48px, hero 0.436 / 0.449. Shots (viewed): /workspace/mason/sow-golive-live-2026-11-28/phone-390-fold-clsfix@2x.png and desktop-1280-fold-clsfix@2x.png. Form not submitted.

## 2026-11-28 ~2:00 PM CT: Shears heading cut (BLOCK at cc29eec)

Source: /workspace/shears/cuts/cleverdates.com-small-odd-web-2026-11-28.md. Replaced the unsourced weekly/five-sites heading with exactly "Get new odd sites by email." Robot-check line kept. No other 'a week', 'weekly', 'five odd', or 'once a week' copy was in the shipped HTML or JS (meta, alt, and signup.js thanks text had none). Nothing else changed. Form not submitted. build.mjs hook left intact.

Live SHA, grep, fold prose, visual-qa-gate, and shots: see the next entry after Pages builds.
