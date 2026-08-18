/* Bliss & Butter — post-change smoke test.
 *
 * These pages render themselves in the browser from a template embedded in the
 * page, so a change can leave every file valid, every request 200, and the
 * element count unchanged while the page shows something entirely wrong. That
 * happened once already: an HTML comment in <head> mentioned the template's own
 * opening tag, the runtime searches the raw file text for the first occurrence
 * of it when it re-fetches the page, and every visitor got the comment's prose
 * rendered as the whole site. Counting elements did not catch it; reading the
 * text did.
 *
 * So this checks what a person would check: that each page shows its own words,
 * shows no leaked source, and leaves no unresolved {{ bindings }} on screen.
 *
 *   npx http-server site -p 8899 -c-1 &
 *   node tools/smoke.mjs http://127.0.0.1:8899
 *
 * Needs Playwright's chromium (npx playwright install chromium).
 */
import { chromium, devices } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:8899').replace(/\/$/, '');

const PAGES = [
  ['/', /ORDER NOW|FREE DELIVERY/i],
  ['/product.html?category=cookies', /COOKIE|CHOCOLATE/i],
  ['/menu.html', /BAKE|MENU|CART/i],
  ['/checkout.html', /CART|CHECKOUT/i],
  ['/custom-order.html', /CUSTOM|ORDER/i]
];

// Prose that only appears in the page source. Seeing it on screen means the
// runtime mistook part of the file for the template.
const LEAKED = /Preloading them puts|the raw template below|Keep the template's own tag name/;
// An unresolved binding on screen means the template rendered without its logic.
const UNRESOLVED = /\{\{\s*[A-Za-z_$]/;

const browser = await chromium.launch();
let failures = 0;

for (const mobile of [false, true]) {
  const ctx = await browser.newContext(mobile ? devices['iPhone 13'] : {});
  for (const [path, expected] of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    // The runtime re-fetches the page and recompiles the template after the
    // first render; wait for that second pass before judging anything.
    await page.waitForTimeout(3000);

    const r = await page.evaluate(() => ({
      text: document.body.innerText,
      styled: document.querySelectorAll('#dc-root [style]').length,
      repaired: window.__bbStyleGuard ? window.__bbStyleGuard.repaired : null
    }));

    const problems = [];
    if (!expected.test(r.text)) problems.push('page content missing');
    if (LEAKED.test(r.text)) problems.push('page source leaked into the render');
    if (UNRESOLVED.test(r.text)) problems.push('unresolved {{ binding }} on screen');
    if (r.styled < 5) problems.push('almost nothing carries a style (' + r.styled + ')');
    if (errors.length) problems.push(errors.length + ' script error(s): ' + errors[0]);

    if (problems.length) failures++;
    console.log(
      (problems.length ? 'FAIL' : 'PASS') + '  ' +
      (mobile ? 'mobile ' : 'desktop') + '  ' + path.padEnd(32) +
      'styled=' + String(r.styled).padEnd(5) +
      'repaired=' + r.repaired +
      (problems.length ? '\n      ' + problems.join('\n      ') : '')
    );
    await page.close();
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? '\n' + failures + ' page(s) failed' : '\nall pages OK');
process.exit(failures ? 1 : 0);
