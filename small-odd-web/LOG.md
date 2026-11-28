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
