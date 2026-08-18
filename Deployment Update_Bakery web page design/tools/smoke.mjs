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
 * style — font, background and border, not merely that their text is present.
 *
 *   npx http-server site -p 8899 -c-1 &
 *   node tools/smoke.mjs http://127.0.0.1:8899
 *
 * Needs Playwright's chromium (npx playwright install chromium).
 */
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:8899').replace(/\/$/, '');

const PAGES = ['/index.html', '/menu.html', '/product.html', '/checkout.html', '/custom-order.html', '/404.html'];
const VIEWS = [
  { name: 'desktop', width: 1440, height: 900, shell: '.bb-d', hidden: '.bb-m' },
  { name: 'mobile', width: 390, height: 844, shell: '.bb-m', hidden: '.bb-d' }
];

/* Buttons and links that have gone unstyled before. Matched by their own words,
   because the prerendered markup carries no hooks of its own. */
const TARGETS = ['ORDER NOW', 'CUSTOM ORDER', 'CUSTOM', 'BREAD', 'COOKIES', 'PASTRIES'];

const browser = await chromium.launch();
let failures = 0;

for (const view of VIEWS) {
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: view.width, height: view.height }
  });

  for (const path of PAGES) {
    const page = await ctx.newPage();
    const problems = [];
    const res = await page.goto(base + path, { waitUntil: 'load' });
    if (!res || !res.ok()) problems.push('HTTP ' + (res ? res.status() : 'no response'));

    const html = await page.content();
    if (/<x-dc/.test(html)) problems.push('page still ships a template block — prerender did not run');
    if (/\{\{\s*[A-Za-z_$]/.test(html)) problems.push('page ships unresolved bindings');
    if (/fonts\.googleapis|unpkg\.com|gstatic\.com/.test(html)) problems.push('page references a third-party host');

    const r = await page.evaluate((v) => {
      const out = { sheets: 0, rules: 0, shellNodes: 0, hiddenShown: false, styled: 0, samples: [] };
      for (const s of document.styleSheets) {
        out.sheets++;
        try { out.rules += s.cssRules.length; } catch (e) { /* opaque */ }
      }
      const shell = document.querySelector(v.shell);
      const hidden = document.querySelector(v.hidden);
      out.shellNodes = shell ? shell.querySelectorAll('*').length : 0;
      out.hiddenShown = !!(hidden && hidden.offsetParent !== null);
      out.styled = document.querySelectorAll('#bb-static [style]').length;

      const wanted = v.targets;
      const nodes = shell ? shell.querySelectorAll('a,button') : [];
      for (const el of nodes) {
        const label = (el.textContent || '').trim().toUpperCase();
        if (!wanted.includes(label)) continue;
        if (out.samples.some((s) => s.label === label)) continue;
        const cs = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        out.samples.push({
          label,
          font: cs.fontFamily,
          bg: cs.backgroundColor,
          border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
          radius: cs.borderTopLeftRadius,
          padding: cs.paddingLeft,
          w: Math.round(box.width),
          h: Math.round(box.height)
        });
      }
      return out;
    }, { ...view, targets: TARGETS });

    if (r.rules < 20) problems.push('stylesheet missing or empty (' + r.rules + ' rules across ' + r.sheets + ' sheets)');
    if (r.shellNodes < 15) problems.push('breakpoint tree is nearly empty (' + r.shellNodes + ' nodes in ' + view.shell + ')');
    if (r.hiddenShown) problems.push('both breakpoint trees are visible (' + view.hidden + ' not hidden)');
    if (path !== '/404.html' && r.styled < 20) problems.push('almost nothing carries inline style (' + r.styled + ')');

    if (path !== '/404.html' && path !== '/checkout.html' && !r.samples.length) {
      problems.push('none of the checked controls were found');
    }
    for (const s of r.samples) {
      const font = s.font.toLowerCase();
      if (!/nunito|lilita/.test(font)) problems.push(s.label + ': fallback font (' + s.font + ')');
      if (s.bg === 'rgba(0, 0, 0, 0)' && !/^(BREAD|COOKIES|PASTRIES|CUSTOM)$/.test(s.label)) {
        problems.push(s.label + ': no background colour');
      }
      if (s.h < 20 || s.w < 20) problems.push(s.label + ': collapsed box (' + s.w + 'x' + s.h + ')');
      if (/^(ORDER NOW|CUSTOM ORDER)$/.test(s.label) && parseFloat(s.border) < 1) {
        problems.push(s.label + ': missing border (' + s.border + ')');
      }
    }

    if (problems.length) failures++;
    console.log(
      (problems.length ? 'FAIL' : 'PASS') + '  ' + view.name.padEnd(7) + ' ' + path.padEnd(20) +
      'rules=' + String(r.rules).padEnd(5) + 'nodes=' + String(r.shellNodes).padEnd(6) +
      'inline=' + String(r.styled).padEnd(5) + 'checked=' + r.samples.length +
      (problems.length ? '\n      ' + problems.join('\n      ') : '')
    );
    for (const s of r.samples) {
      console.log('        ' + s.label.padEnd(14) + s.font.split(',')[0].padEnd(14) +
        'bg=' + s.bg.padEnd(22) + 'border=' + s.border);
    }
    await page.close();
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? '\n' + failures + ' page/view combination(s) failed' : '\nall pages OK with JavaScript disabled');
process.exit(failures ? 1 : 0);
