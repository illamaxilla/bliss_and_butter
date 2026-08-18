/* Bliss & Butter — smoke test for the prerendered build.
 *
 * The failure this guards against changed shape. Pages used to compile
 * themselves in the visitor's browser, so a broken render showed up as leaked
 * source or literal bindings on screen. Now the HTML ships finished, and the
 * ways it can break are: the prerender did not run (the page still carries a
 * template block, or ships almost no markup), the stylesheet is missing or
 * empty (markup arrives unstyled), or the wrong breakpoint tree is showing.
 *
 * So every page is loaded WITH JAVASCRIPT DISABLED, at a desktop and a mobile
 * width, and the previously fragile elements are checked for real computed
 * style — font and box geometry, not merely that their text is present.
 *
 *   npx http-server site -p 8899 -c-1 &
 *   node tools/smoke.mjs http://127.0.0.1:8899
 *
 * Needs Playwright's chromium (npx playwright install chromium).
 */
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:8899').replace(/\/$/, '');

/* 404.html is `plain`: a standalone page that carries its own styling in a
   <style> block and has no breakpoint trees, so the checks that assume a
   prerendered DC page do not apply to it. */
const PAGES = [
  { path: '/index.html' },
  { path: '/menu.html' },
  { path: '/product.html' },
  { path: '/checkout.html' },
  { path: '/custom-order.html' },
  { path: '/404.html', plain: true }
];

const VIEWS = [
  { name: 'desktop', width: 1440, height: 900, shell: '.bb-d', hidden: '.bb-m' },
  { name: 'mobile', width: 390, height: 844, shell: '.bb-m', hidden: '.bb-d' }
];

/* Controls that have gone unstyled before. Matched by their own words, because
   the prerendered markup carries no hooks of its own. Every one of them must
   render in a brand face and occupy a real box.

   The same words appear as both filled pills and plain text links depending on
   the page — CUSTOM is a 19px nav link on the home page and a 45px pill on the
   custom-order builder — so nothing here asserts chrome on a specific word. */
const TARGETS = [
  'ORDER NOW', 'CUSTOM ORDER', 'START A CUSTOM ORDER', 'START BAKING',
  'KEEP SHOPPING', 'ADD TO CART', 'BROWSE THE MENU', 'GO TO CHECKOUT',
  'VIEW ALL COOKIES', 'CUSTOM', 'BREAD', 'COOKIES', 'PASTRIES'
];

/* The subset that exists as a filled pill somewhere on every DC page, at both
   widths. At least one of them must render as one — brand face, a real
   background colour and a button-sized box. That is the assertion that proves
   the page's styling actually landed, rather than the text merely being there. */
const PILLS = [
  'ORDER NOW', 'CUSTOM ORDER', 'START A CUSTOM ORDER', 'START BAKING',
  'KEEP SHOPPING', 'ADD TO CART', 'BROWSE THE MENU', 'GO TO CHECKOUT'
];

const BRAND_FACE = /nunito|lilita/;

const browser = await chromium.launch();
let failures = 0;

for (const view of VIEWS) {
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: view.width, height: view.height }
  });

  for (const { path, plain } of PAGES) {
    const page = await ctx.newPage();
    const problems = [];
    const res = await page.goto(base + path, { waitUntil: 'load' });
    if (!res || !res.ok()) problems.push('HTTP ' + (res ? res.status() : 'no response'));

    const html = await page.content();
    if (/<x-dc/.test(html)) problems.push('page still ships a template block — prerender did not run');
    if (/\{\{\s*[A-Za-z_$]/.test(html)) problems.push('page ships unresolved bindings');
    if (/fonts\.googleapis|unpkg\.com|gstatic\.com/.test(html)) problems.push('page references a third-party host');

    const r = await page.evaluate((v) => {
      const out = { sheets: 0, rules: 0, bodyNodes: 0, shellNodes: 0, hiddenShown: false, styled: 0, samples: [] };
      for (const s of document.styleSheets) {
        out.sheets++;
        try { out.rules += s.cssRules.length; } catch (e) { /* opaque */ }
      }
      out.bodyNodes = document.body.querySelectorAll('*').length;
      const shell = document.querySelector(v.shell);
      const hidden = document.querySelector(v.hidden);
      out.shellNodes = shell ? shell.querySelectorAll('*').length : 0;
      out.hiddenShown = !!(hidden && hidden.offsetParent !== null);
      out.styled = document.querySelectorAll('#bb-static [style]').length;

      const nodes = shell ? shell.querySelectorAll('a,button') : [];
      for (const el of nodes) {
        const label = (el.textContent || '').trim().toUpperCase().replace(/\s+/g, ' ');
        if (!v.targets.includes(label)) continue;
        const cs = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        out.samples.push({
          label,
          font: cs.fontFamily,
          bg: cs.backgroundColor,
          border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
          w: Math.round(box.width),
          h: Math.round(box.height)
        });
      }
      return out;
    }, { ...view, targets: TARGETS });

    if (plain) {
      /* No bb.css and no breakpoint trees by design — it carries its own
         <style> block, so all it has to prove is that it arrived styled. */
      if (r.rules < 3) problems.push('page carries no styling (' + r.rules + ' rules across ' + r.sheets + ' sheets)');
      if (r.bodyNodes < 5) problems.push('page is nearly empty (' + r.bodyNodes + ' nodes)');
    } else {
      if (r.rules < 20) problems.push('stylesheet missing or empty (' + r.rules + ' rules across ' + r.sheets + ' sheets)');
      if (r.shellNodes < 15) problems.push('breakpoint tree is nearly empty (' + r.shellNodes + ' nodes in ' + view.shell + ')');
      if (r.hiddenShown) problems.push('both breakpoint trees are visible (' + view.hidden + ' not hidden)');
      if (r.styled < 20) problems.push('almost nothing carries inline style (' + r.styled + ')');

      /* Every matched control must be in a brand face and occupy a real box.
         A 19px-tall nav link is fine here; a collapsed or zero-size one is not. */
      const seen = new Set();
      for (const s of r.samples) {
        if (seen.has(s.label)) continue;
        seen.add(s.label);
        if (!BRAND_FACE.test(s.font.toLowerCase())) problems.push(s.label + ': fallback font (' + s.font + ')');
        if (s.h < 12 || s.w < 20) problems.push(s.label + ': collapsed box (' + s.w + 'x' + s.h + ')');
      }

      const pill = r.samples.find((s) =>
        PILLS.includes(s.label) &&
        s.bg !== 'rgba(0, 0, 0, 0)' &&
        s.h >= 30 &&
        BRAND_FACE.test(s.font.toLowerCase()));
      if (!pill) {
        problems.push('no filled pill rendered — nothing proves the styling landed');
      }
    }

    if (problems.length) failures++;
    const shown = [...new Map(r.samples.map((s) => [s.label, s])).values()];
    console.log(
      (problems.length ? 'FAIL' : 'PASS') + '  ' + view.name.padEnd(7) + ' ' + path.padEnd(20) +
      'rules=' + String(r.rules).padEnd(5) + 'nodes=' + String(r.shellNodes).padEnd(6) +
      'inline=' + String(r.styled).padEnd(5) + 'checked=' + shown.length +
      (problems.length ? '\n      ' + problems.join('\n      ') : '')
    );
    for (const s of shown) {
      console.log('        ' + s.label.padEnd(22) + s.font.split(',')[0].padEnd(14) +
        'bg=' + s.bg.padEnd(22) + String(s.w) + 'x' + s.h);
    }
    await page.close();
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? '\n' + failures + ' page/view combination(s) failed' : '\nall pages OK with JavaScript disabled');
process.exit(failures ? 1 : 0);
