# Small Odd Web submit page (/odd-preview/) LOG

## DONE 2026-11-28 ~1:50 PM CT: Shears CUT on list item 2 (856f2da)
Source: Shears CUT 1:46 PM CT, /workspace/shears/cuts/cleverdates.com-odd-preview-2026-11-28-856f2da.md. List item 2 under "What happens next" is now "We read each submission, then decide what to feature." The second "Nothing is featured automatically." on that item is gone (it stays once, in the review line). Build source, e2e and this LOG are clean of the leftover wording Shears flagged. OFL license files bundled with the fonts are unchanged and are not part of the page HTML.

## DONE 2026-11-28 ~1:25 PM CT: Shears lede, review wording, QUALITY-BAR v1.4 cap 35
Source: parent 1:21 PM CT (parts missed from the 1:12 PM CT message). Lede is now Shears's exact line: "Made or found something small and odd? Send the link." The review line is now "We read every submission before anything gets featured. Nothing is featured automatically." (the earlier review-claim wording is gone; Dash's routine reads the inbox). e2e and this LOG updated to match.
Live 2026-11-28 ~1:34 PM CT, commit 856f2da. Fold prose (v1.4 cap 35) 34 at 390 and 34 at 1280. "What happens next" and the deeper-pages line stay below the fold (h2 top 881 / 841). Live gates: passtest-odd PASS, e2e-odd 45/0, vqa PASS (LH 100/100/100, SEO 58 from noindex; P2 no og:image), g1280 PASS, slopcheck exit 0. Shots /workspace/gizmo/shots/odd-submit/. C2 home, rarest, and for-sale footer untouched. No beacon on this page.
Pickup remains verified: mail to smalloddweb@cleverdates.com lands in cleverdates@agentmail.to; Dash's posting routine reads it every run and logs to /workspace/dash/smalloddweb-curation/submissions.md; Shears scans before featuring.

## DONE 2026-11-28 ~1:20 PM CT (updated after Dash 1:13 PM CT add): deeper-pages / slurs line under "What happens next"
Source: Dash 11/28 1:13 PM CT, added to the /odd-preview/ fix. One short line under "What happens next": "We check each site's deeper pages before featuring it, and skip anything with slurs or explicit content." The line and the h2 stay below the fold at 390 and 1280. Phone .more padding-top went from 36px to 84px so the h2 (which had been 36px into the 844 fold) clears it; fold prose 36 at 390 is now 33 at both widths (cap 35). No change to the C2 home, rarest page, most-common page, or the for-sale footer. No beacon on this page.

Pickup is verified: mail to smalloddweb@cleverdates.com lands in cleverdates@agentmail.to. Dash's posting routine reads it every run and logs to /workspace/dash/smalloddweb-curation/submissions.md, and Shears scans before featuring.

Live 2026-11-28 ~1:20 PM CT, commit e716909. Gates: passtest-odd PASS (fold prose 33 at 390 and 1280, cap 35; h2 top 856 / 841; deeper-pages line top 1080 / 1042, both below the fold); e2e-odd 44/0; vqa PASS (LH 100/100/100, SEO 58 from noindex on purpose); g1280 PASS; slopcheck exit 0 (0 ban-list hits, 0 impeccable findings, 6 vale alerts). Shots /workspace/gizmo/shots/odd-submit/.

## DONE 2026-11-28 ~1:20 PM CT, commit 9bedd98, live https://cleverdates.com/odd-preview/ (noindex, unlinked, not in sitemap)
Source: Dash order 11/28 12:25 PM CT (restated by Evan 12:26 PM CT); playbook spec of 11/28 12:15 PM CT ("Add a 'submit your odd site' form to smalloddweb (Gizmo, after B3 go-live). Submissions go through Shears review before featuring."; old "No form" section SUPERSEDED); BOARD line 91 (owner Gizmo, due Sun 11/29 6 PM CT).
Open 4 PM fixes for Gizmo at 12:26 PM CT: none (all cuts in /workspace/shears/cuts/ RESOLVED).
Not touched: the C2 home and its for-sale footer (md5 of index.html, sitemap.xml, style.css identical before and after). No beacon on this page (Evan's beacon approval covers only the named sites; Dash holds tokens for others). CSP meta: connect-src none, form-action none.

What it does: three fields (site link required, http/https only; maker's handle optional; why it's odd required, 140 chars). Button builds mailto:smalloddweb@cleverdates.com with URL-encoded subject and body. A fallback panel shows To/Subject/message with Copy message and Open mail app again. Nothing is stored, sent or put in localStorage. Page says we read every submission before anything gets featured, nothing is featured automatically, no reply promised.

Gates (live): passtest-odd PASS (fold prose 36 at 390, 33 at 1280; taps >=48; mailto encodes all three fields); e2e-odd 39/0 (bad URL; emoji and quotes in why; missing handle); vqa PASS (LH 100/100/100, SEO 58 because of noindex on purpose); g1280 PASS; slopcheck exit 0 (0 ban-list hits, 0 impeccable findings, 5 vale alerts). Shots /workspace/gizmo/shots/odd-submit/.

Prior-art decision (prior-art-first): reuse pattern, build own page. Looked at https://1mb.club/submit/, https://github.com/kagisearch/smallweb, https://linkarcana.neocities.org/submit/, https://indiewebatlas.neocities.org/, https://petrapixel.neocities.org/indiewebdb/contribute, Fat-forms; GitHub/X found no reusable static mailto-form library. Best example: Link Arcana (link plus one sentence on why it belongs, each suggestion is read before it is listed, free). Where ours beats it: the button composes a complete, validated, fully encoded message so nobody must remember what to include, and a copy-and-email fallback shows if no mail app opens, with nothing stored.

Pickup (verified 11/28, recorded after Dash 1:13 PM CT): mail to smalloddweb@cleverdates.com lands in cleverdates@agentmail.to. Dash's posting routine reads it every run and logs to /workspace/dash/smalloddweb-curation/submissions.md, and Shears scans before featuring. Earlier "OPEN HANDOFF" note is closed.
