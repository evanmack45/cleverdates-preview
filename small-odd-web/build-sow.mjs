// Builds the Small Odd Web gallery into ../docs/small-odd-web/ (cleverdates.com/small-odd-web/).
// Called at the end of site-build/build.mjs after odd-preview. Writes only inside docs/small-odd-web/
// and never touches the C2 home, sitemap, robots.txt, or /odd-preview/.
import { mkdirSync, copyFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'src');
const out = join(here, '..', 'docs', 'small-odd-web');

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const a = join(from, name);
    const b = join(to, name);
    if (statSync(a).isDirectory()) copyTree(a, b);
    else copyFileSync(a, b);
  }
}

rmSync(out, { recursive: true, force: true });
copyTree(src, out);
console.log(`built ${out}`);
