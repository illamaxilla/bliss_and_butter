# Bliss & Butter — prerendered static build

`site/` is generated. Do not hand-edit anything in it except the asset folders.

## What ships

Each of `index.html`, `menu.html`, `product.html`, `checkout.html`,
`custom-order.html` and `404.html` is finished HTML. View-source shows the page:
no template block, no `{{ }}` bindings, no transpiler, no CDN. Every page holds
**both** breakpoint trees — the desktop one and the mobile one — and
`bb.css` decides which is shown at the existing 900px breakpoint, so the right
layout appears with JavaScript disabled. The hidden tree's images are
`loading="lazy"`, so they are never fetched while it is `display:none`.

Per-element styling stays inline exactly as the DC templates author it. Only the
global rules the templates declare in their helmet blocks are hoisted, into
`bb.css`, so they apply before any script runs.

```
site/
  index.html menu.html product.html checkout.html custom-order.html 404.html
  bb.css                     generated: helmet styles + breakpoint switch
  hydrate.js                 attaches behaviour to the finished page
  art-slot.js                draws art slots in the hydrated tree
  dc-runtime.js              component runtime, no CDN, no SRI, no transpiler
  tpl/*.tpl.html             page templates, fetched only when JS is on
  *-mobile.dc.html           mobile trees, fetched only when JS is on
  products.js catalog.js product-images.js cart.js search.js custom-order.js
  vendor/react*.js vendor/fonts.css vendor/fonts/*.woff2
  uploads/ packaging/ brand/ favicons robots.txt sitemap.xml
  diag.html                  field diagnostic, keep until live-vs-local is closed
src-dc/                      SOURCE OF TRUTH — the DC pages, edited in Claude Design
tools/prerender.mjs          src-dc/ -> site/, real Chromium, one renderer
tools/bb-head.css            fixed head of the generated bb.css
tools/smoke.mjs              six pages, two widths, JavaScript disabled
tools/set-site-url.mjs       unchanged; still Netlify's whole build command
```

## How appearance and behaviour are separated

`hydrate.js` fetches the page's template, mounts the live component tree into a
hidden container, and swaps it in only once it has rendered. Until then — and
forever, if the script is blocked, fails or arrives late — the visitor keeps the
prerendered page. Nothing about how the page looks depends on script execution,
which is the whole point of this packaging.

Behaviour is unchanged: mobile nav drawer, cart sheet, add/remove/quantity,
localStorage cart, category chips, carousels and dots, type-ahead search, the
custom-order builder, the checkout flow.

`image-slot.js` is never loaded by a page. The authoring component carries
drag-and-drop, IndexedDB persistence and mutation observers a visitor never uses,
and it froze the page when it ran across two mounted trees. Its one job that
matters here is covered twice: the prerender flattens every filled slot into a
real `<img>`, so the photography is in the served bytes and shows with JavaScript
disabled, and `art-slot.js` (40 lines) draws the same photo in the hydrated tree,
which renders `<image-slot>` elements itself.

The file itself does still sit in `site/`, because the build harness loads it to
resolve the slots in the first place (`BUILD_LIBS` in `tools/prerender.mjs`). It
is dead weight in the deploy, not a dependency of any page.

## Editing a design

1. Edit the `.dc.html` in the Claude Design project.
2. Copy the changed file into `src-dc/` (same filename) and push to `main`.
3. The `prerender` workflow renders it in headless Chromium, runs the smoke test
   with JavaScript disabled, and commits the regenerated `site/`.
4. Netlify deploys that commit with its build command unchanged.

There is no manual porting step and no second renderer: `tools/prerender.mjs`
boots `src-dc/support.js`, the same runtime the design tool uses, and captures
what it produced. It reaches the network for nothing — the harness it boots is
put through the same vendoring as the shipped runtime, so React is served from
`site/vendor/` at build time too, and the build cannot be taken down by a CDN.

Keep the Playwright pin in the workflow where it is. Chromium serializes inline
styles slightly differently between versions (`border: none` against
`border-width: medium; border-style: none; …`), so bumping it rewrites most of
`site/` with no change in meaning. It is safe, just noisy — do it deliberately,
not as a drive-by.

## Never put a CI skip marker in a commit message

`[skip ci]` — and Netlify's `[skip netlify]` — are read from the **whole** commit
message, subject line and body alike, by both GitHub Actions and Netlify. A
commit carrying one anywhere in its text gets no workflow run and no deploy. It
fails silently: nothing goes red, the Actions tab simply has no entry and the
site quietly stays on the previous build.

That is easy to trip over precisely when writing about it — a commit whose
message *discusses* the marker is skipped just as thoroughly as one that means
it. Describe it in prose ("the skip marker") and keep the literal spelling in
files like this one, which nothing scans.

## If the prerender ever silently stops running

Symptom to expect: the site looks stale, or a deploy ships an unstyled page.
Check, in order:

1. **The workflow ran.** Actions → `prerender` on the last `main` commit. It only
   triggers on `src-dc/**` and `tools/prerender.mjs` — a design change committed
   anywhere else will not fire it.
2. **The commit exists.** `git log -1 -- site/index.html` should point at a
   `prerender: regenerate site/` commit newer than your `src-dc/` change.
3. **The served page is finished.** `curl -s https://SITE/index.html | grep -c
   'bb-shell'` returns 2. `grep -c '{{' ` returns 0. `grep 'x-dc'` returns
   nothing.
4. **The stylesheet is there.** `curl -sI https://SITE/bb.css` is 200 and the
   body is over 5KB.
5. Run `node tools/smoke.mjs` against the live URL. It fails loudly on all four
   of those conditions, and on a page whose controls have lost their styling.

## Local check

```
npx playwright install chromium
node tools/prerender.mjs
npx http-server site -p 8899 -c-1 &
node tools/smoke.mjs http://127.0.0.1:8899
```

## Landmines removed

- No SRI hashes for the vendored React files, and no preload tags carrying them.
  Replacing a vendored file is now a one-file change.
- Nothing searches raw file text for a template tag, so a stray mention of it in
  a comment can no longer replace the page.
- `style-guard.js` is gone; it existed only to compensate for runtime rendering.
