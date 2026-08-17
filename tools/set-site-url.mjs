/* Stamp the real site URL into robots.txt and sitemap.xml at deploy time.
 *
 * Both files need absolute URLs, but the address isn't known until Netlify
 * deploys — and it changes again when a custom domain is attached. Netlify
 * exposes the current address in the environment, so the placeholder domain
 * committed to the repo gets replaced during the build rather than by hand.
 *
 * Netlify sets:
 *   URL              main address of the site (custom domain once attached)
 *   DEPLOY_PRIME_URL address of this particular deploy (branch/preview builds)
 *   CONTEXT          production | deploy-preview | branch-deploy
 *
 * Outside Netlify none of these exist, so the script leaves the files alone
 * and serving site/ locally keeps working.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PLACEHOLDER = 'https://blissandbutter.com';
const context = process.env.CONTEXT;
const isProduction = context === 'production';

// Previews and branch deploys describe themselves, not the live site, so they
// must not publish the production URL in a sitemap.
const siteUrl = (isProduction ? process.env.URL : process.env.DEPLOY_PRIME_URL || process.env.URL) || '';

if (!siteUrl) {
  console.log('[set-site-url] no Netlify URL in the environment — leaving files unchanged');
  process.exit(0);
}

const base = siteUrl.replace(/\/+$/, '');
console.log(`[set-site-url] context=${context || 'none'} url=${base}`);

for (const file of ['site/robots.txt', 'site/sitemap.xml']) {
  if (!existsSync(file)) {
    console.warn(`[set-site-url] ${file} missing — skipped`);
    continue;
  }
  const before = readFileSync(file, 'utf8');
  const after = before.split(PLACEHOLDER).join(base);
  if (after !== before) {
    writeFileSync(file, after);
    console.log(`[set-site-url] rewrote ${file}`);
  }
}

// Keep previews and branch deploys out of search results — they serve the same
// content as production and would otherwise compete with it.
if (!isProduction) {
  writeFileSync(
    'site/robots.txt',
    `# ${context || 'non-production'} deploy — not for indexing\nUser-agent: *\nDisallow: /\n`
  );
  console.log('[set-site-url] non-production deploy — robots.txt set to disallow indexing');
}
