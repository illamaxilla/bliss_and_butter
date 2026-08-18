/* Bliss & Butter — prerender.
 *
 * Turns the DC sources in src-dc/ into finished static HTML in site/.
 *
 * The DC templates stay the single source of truth: this script does not
 * reimplement what they mean. It boots the real authoring runtime
 * (src-dc/support.js) in headless Chromium, once per page per breakpoint, and
 * captures the DOM the runtime produced. There is only ever one renderer.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node tools/prerender.mjs
 *
 * Output per page: one document containing BOTH breakpoint trees, the desktop
 * one and the mobile one, switched by a media query in site/bb.css. Nothing
 * about how the page looks depends on script execution.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const SRC = 'src-dc';
const OUT = 'site';
const PORT = 8931;

/* Each page: its DC source, the DC that draws its mobile tree, and the name the
   shipped template keeps under site/tpl/. menu has no separate mobile DC — its
   single DC draws both trees. */
const PAGES = [
  { out: 'index.html', src: 'index.html', mobileSrc: 'home-mobile.dc.html', tpl: 'index' },
  { out: 'menu.html', src: 'menu.html', mobileSrc: null, tpl: 'menu' },
  { out: 'product.html', src: 'product.html', mobileSrc: 'product-mobile.dc.html', tpl: 'product' },
  { out: 'checkout.html', src: 'checkout.html', mobileSrc: 'checkout-mobile.dc.html', tpl: 'checkout' },
  { out: 'custom-order.html', src: 'custom-order.html', mobileSrc: 'custom-order-mobile.dc.html', tpl: 'custom-order' }
];

/* Loaded by the shipped pages, in this order. image-slot.js is deliberately
   absent: the authoring component carries drag-and-drop, IndexedDB persistence
   and mutation observers a visitor never uses, and it froze the page when it ran
   across two mounted trees. Its one job that matters here — putting the photo on
   screen — is done twice over: filled slots are flattened to real <img> in the
   prerendered markup (see flattenSlots), and art-slot.js covers the hydrated
   tree, which renders <image-slot> elements itself. */
const SHIP_ORDER = ['product-images.js', 'products.js', 'catalog.js', 'cart.js', 'search.js', 'custom-order.js'];
const BUILD_LIBS = ['image-slot.js', 'product-images.js', 'products.js', 'catalog.js', 'cart.js', 'search.js', 'custom-order.js'];

const read = (p) => readFileSync(p, 'utf8');

/* The DC runtime with its external dependencies removed: React comes from
   site/vendor/, the transpiler is gone, and it no longer refetches its own page.
   Both the runtime the visitor gets and the copy the build harness boots go
   through this, so the prerender never reaches the network — if unpkg is down or
   unreachable, the build must still produce the same bytes.

   `vendorBase` is '' for the shipped runtime, which sits beside vendor/, and '/'
   for the harness, which is served from /_build/ and needs a root-absolute path. */
function localRuntime(support, vendorBase = '') {
  return support
    .split('https://unpkg.com/react@18.3.1/umd/react.production.min.js').join(`${vendorBase}vendor/react.production.min.js`)
    .split('https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js').join(`${vendorBase}vendor/react-dom.production.min.js`)
    .split('sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z').join('')
    .split('sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1').join('')
    .split('fetch(location.href)').join('Promise.reject(0)')
    .split('var BABEL_URL = "https://unpkg.com/@babel/standalone@7.26.4/babel.min.js";').join('var BABEL_URL = null;')
    .replace('      if (window.Babel) return Promise.resolve();\n      if (babelLoading) return babelLoading;',
      '      if (window.Babel) return Promise.resolve();\n      if (babelLoading) return babelLoading;\n      return Promise.reject(new Error("no external transpiler in this build"));')
    .replace('s.integrity = integrity;', 'if (integrity) s.integrity = integrity;\n      s.crossOrigin = null;');
}

function helmetOf(raw) {
  const m = /<helmet>([\s\S]*?)<\/helmet>/i.exec(raw);
  if (!m) return { styles: [], scripts: [] };
  return {
    styles: [...m[1].matchAll(/<style>([\s\S]*?)<\/style>/gi)].map((x) => x[1].trim()),
    scripts: [...m[1].matchAll(/<script src="([^"]+)"><\/script>/gi)].map((x) => x[1].replace(/^\.\//, ''))
  };
}

function templateBlock(raw) {
  const open = /<x-dc(?:\s[^>]*)?>/.exec(raw);
  if (!open) throw new Error('no template block in source');
  const close = raw.lastIndexOf('</' + 'x-dc>');
  const logic = /<script[^>]*data-dc-script[^>]*>[\s\S]*?<\/script>/.exec(raw);
  return {
    block: raw.slice(open.index, close + 7).replace(/<helmet>[\s\S]*?<\/helmet>/i, ''),
    logic: logic ? logic[0] : ''
  };
}

function headOf(raw) {
  const h = raw.slice(raw.indexOf('<head>') + 6, raw.indexOf('</head>'));
  return h
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*preconnect[^>]*>/gi, '')
    .replace(/<link[^>]*fonts\.googleapis[^>]*>/gi, '')
    .replace(/<link[^>]*rel="preload"[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
}

/* Build-time scratch page: the template, the libs, the runtime. Served from
   site/ so relative data and asset URLs resolve exactly as in production. */
function harness(raw, view) {
  const { block, logic } = templateBlock(raw);
  const force = view === 'mobile';
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<script>
  window.matchMedia = function (q) {
    var m = /max-width/i.test(String(q)) ? ${force} : ${!force};
    return { matches: m, media: String(q), onchange: null, addEventListener: function () {},
      removeEventListener: function () {}, addListener: function () {}, removeListener: function () {},
      dispatchEvent: function () { return false; } };
  };
</script>
${BUILD_LIBS.map((l) => `<script src="/${l}"></script>`).join('\n')}
<script src="/_build/support.js"></script>
</head><body>
${block}
${logic}
</body></html>`;
}

function serve(root) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };
  const server = createServer((req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    const file = join(root, path === '/' ? '/index.html' : path);
    try {
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': types[extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((r) => server.listen(PORT, '127.0.0.1', () => r(server)));
}

async function capture(page, url) {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(
    () => { const r = document.getElementById('dc-root'); return !!(r && r.firstElementChild); },
    null, { timeout: 20000 }
  );
  await page.waitForTimeout(1200); // let mount effects settle
  return page.evaluate(() => {
    const r = document.getElementById('dc-root');
    return { html: r.innerHTML, nodes: r.querySelectorAll('*').length };
  });
}

/* Turn every filled <image-slot> into a real <img>, so the photography is in the
   served bytes and appears with JavaScript disabled. product-images.js binds the
   photo through the slot's own `src`, which is why the src is already here. A
   slot with no resolvable src keeps its neutral frame (one rule in bb.css). */
function flattenSlots(html) {
  return html.replace(/<image-slot([^>]*)><\/image-slot>/g, (all, attrs) => {
    const get = (n) => { const m = new RegExp(n + '="([^"]*)"').exec(attrs); return m ? m[1] : null; };
    const src = get('src');
    if (!src) return all;
    const shape = get('shape') || 'rect';
    const radius = shape === 'rounded' ? (get('radius') || '16') + 'px'
      : shape === 'circle' ? '50%'
      : shape === 'pill' ? '999px' : null;
    let style = get('style') || '';
    if (style && !/;\s*$/.test(style)) style += ';';
    const id = get('id');
    return '<img loading="lazy" decoding="async" alt=""' + (id ? ` data-slot="${id}"` : '') +
      ` src="${src}" style="${style} display: block; object-fit: ` +
      (get('fit') === 'cover' ? 'cover' : 'contain') + ';' + (radius ? ` border-radius: ${radius};` : '') + '">';
  });
}

function clean(html) {
  return flattenSlots(html)
    .replace(/ data-dc-tpl="[^"]*"/g, '')
    .replace(/ data-sc-name="[^"]*"/g, '')
    .replace(/<img (?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async" ');
}

/* ── build ───────────────────────────────────────────────────────────────── */

mkdirSync(join(OUT, '_build'), { recursive: true });
mkdirSync(join(OUT, 'tpl'), { recursive: true });
writeFileSync(join(OUT, '_build/support.js'),
  localRuntime(read(join(SRC, 'support.js')), '/'));

const server = await serve(OUT);
const browser = await chromium.launch();
const styleBlocks = [];
const seen = new Set();
let failures = 0;

try {
  for (const p of PAGES) {
    const raw = read(join(SRC, p.src));
    const mraw = p.mobileSrc ? read(join(SRC, p.mobileSrc)) : '';

    for (const r of [raw, mraw].filter(Boolean)) {
      for (const s of helmetOf(r).styles) if (!seen.has(s)) { seen.add(s); styleBlocks.push(s); }
    }

    const jobs = [
      { view: 'desktop', raw, file: `_build/${p.tpl}.d.html` },
      { view: 'mobile', raw: mraw || raw, file: `_build/${p.tpl}.m.html` }
    ];
    const trees = {};
    for (const j of jobs) {
      writeFileSync(join(OUT, j.file), harness(j.raw, j.view));
      const ctx = await browser.newContext(
        j.view === 'mobile' ? { viewport: { width: 390, height: 844 } } : { viewport: { width: 1440, height: 900 } }
      );
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', (e) => errs.push(e.message));
      const r = await capture(page, `http://127.0.0.1:${PORT}/${j.file}`);
      await ctx.close();
      if (/\{\{/.test(r.html)) { console.error(`FAIL ${p.out} ${j.view}: unresolved bindings in output`); failures++; }
      if (r.nodes < 15) { console.error(`FAIL ${p.out} ${j.view}: only ${r.nodes} nodes rendered`); failures++; }
      if (errs.length) console.warn(`  note ${p.out} ${j.view}: ${errs.length} script error(s): ${errs[0]}`);
      trees[j.view] = clean(r.html);
      console.log(`  rendered ${p.out} ${j.view.padEnd(7)} ${r.nodes} nodes`);
    }

    const libSet = new Set([...helmetOf(raw).scripts, ...(mraw ? helmetOf(mraw).scripts : []), 'products.js']);
    const libs = SHIP_ORDER.filter((l) => libSet.has(l));

    writeFileSync(join(OUT, p.out), `<!DOCTYPE html>
<html lang="en">
<head>
${headOf(raw)}
<link rel="stylesheet" href="vendor/fonts.css">
<link rel="stylesheet" href="bb.css">
</head>
<body>
<div id="bb-static">
<div class="bb-shell bb-d">${trees.desktop}</div>
<div class="bb-shell bb-m">${trees.mobile}</div>
</div>
<div id="bb-live" hidden></div>
${libs.map((l) => `<script src="${l}"></script>`).join('\n')}${/<image-slot/.test(trees.desktop + trees.mobile) || / data-slot="/.test(trees.desktop + trees.mobile) ? '\n<script src="art-slot.js"></script>' : ''}
<script src="hydrate.js" data-tpl="tpl/${p.tpl}.tpl.html"></script>
</body>
</html>
`);

    const t = templateBlock(raw);
    writeFileSync(join(OUT, `tpl/${p.tpl}.tpl.html`), t.block + '\n' + t.logic + '\n');
    if (p.mobileSrc) {
      const m = templateBlock(mraw);
      writeFileSync(join(OUT, p.mobileSrc), m.block + '\n' + m.logic + '\n');
    }
  }

  /* Global stylesheet: the helmet blocks the templates author, hoisted so they
     apply before any script runs, plus the breakpoint switch. */
  writeFileSync(join(OUT, 'bb.css'), `${read('tools/bb-head.css')}
${styleBlocks.join('\n\n')}
`);

  /* The runtime the visitor gets. */
  const rt = localRuntime(read(join(SRC, 'support.js')));
  writeFileSync(join(OUT, 'dc-runtime.js'), rt);
  const external = rt.match(/https?:\/\/[^"']+/g) || [];
  if (external.length) { console.error('FAIL dc-runtime.js still references ' + external[0]); failures++; }

  for (const f of ['index.html', 'menu.html', 'product.html', 'checkout.html', 'custom-order.html', '404.html']) {
    const html = read(join(OUT, f));
    if (/<x-dc/.test(html)) { console.error(`FAIL ${f} ships a template block`); failures++; }
    if (/\{\{/.test(html)) { console.error(`FAIL ${f} ships unresolved bindings`); failures++; }
    if (/fonts\.googleapis|unpkg\.com|gstatic/.test(html)) { console.error(`FAIL ${f} references a third-party host`); failures++; }
    if (/<image-slot[^>]*\bsrc=/.test(html)) { console.error(`FAIL ${f} ships a filled art slot that was not flattened to an image`); failures++; }
  }
} finally {
  await browser.close();
  server.close();
  if (existsSync(join(OUT, '_build'))) rmSync(join(OUT, '_build'), { recursive: true, force: true });
}

console.log(failures ? `\nprerender finished with ${failures} problem(s)` : '\nprerender OK');
process.exit(failures ? 1 : 0);
