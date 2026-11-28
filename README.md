# cleverdates-preview

Noindex preview of "How rare is your birthday?" for cleverdates.com. Type a month and day and get its rank out of 366 in US births, where the MMDD string first shows up in pi, a card image and a link that carries the date.

- `node build.mjs` turns `data/dates.json` into `docs/` (served by GitHub Pages).
- Birth data: FiveThirtyEight, U.S. Births (github.com/fivethirtyeight/data), from the Social Security Administration, 2000-2014. CC BY 4.0. Changed: averaged by month and day, then ranked. License copy in `docs/data/`.
- Pi digits: first 1,000,000 decimals computed with mpmath (BSD-3-Clause) and checked against an independent Chudnovsky run. Only the 366 positions ship.
- Fonts: Gloock and Schibsted Grotesk, SIL Open Font License, self-hosted.
- No cookies or storage. Page views are counted with Cloudflare Web Analytics (one script from static.cloudflareinsights.com, token in the page source). Dates typed stay in the browser and are not sent.
