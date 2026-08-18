# Bliss & Butter

Marketing and ordering site for Bliss & Butter, plus the brand asset library.

## Repository layout

```
src-dc/          SOURCE OF TRUTH — the Claude Design pages
site/            Generated. The deployed website — what Netlify publishes
tools/           prerender, smoke test, deploy-time URL stamping
.github/         The prerender workflow
brand-assets/    Source artwork and photography (not deployed)
netlify.toml     Netlify build & header configuration
README-DEPLOY.md How the build works, and how to edit a design
```

### `site/`

Generated — do not hand-edit anything in it except the asset folders. Every page
is finished HTML: view-source shows the page, with no template block, no
bindings and no transpiler. `tools/prerender.mjs` renders it from `src-dc/` in
headless Chromium and CI commits the result. See `README-DEPLOY.md`.

Pages sit at the root alongside the image folders they reference, because every
image path in the markup is relative (`uploads/…`, `packaging/…`). Keeping that
shape is what makes the images resolve — moving the pages or the image folders
apart breaks them.

| URL | File |
|---|---|
| `/` | `index.html` |
| `/menu.html` | `menu.html` |
| `/product.html` | `product.html` (`?category=&product=`) |
| `/custom-order.html` | `custom-order.html` |
| `/checkout.html` | `checkout.html` |
| not found | `404.html` |

Every page ships **both** breakpoint trees prerendered, and `bb.css` decides
which one is shown at 900px. So the right layout appears with JavaScript
disabled — appearance never waits on a script. The `*-mobile.dc.html` and
`tpl/*.tpl.html` files are fetched only when JavaScript is on, to bring
behaviour to the finished page; they are components, not pages, so nothing
should link to them directly.

Shared scripts: `cart.js` (cart state in localStorage) · `products.js` and
`catalog.js` (catalog data) · `product-images.js` (image registry) ·
`custom-order.js` (builder catalog) · `search.js` · `hydrate.js` (attaches
behaviour) · `art-slot.js` · `dc-runtime.js` (component runtime).

`site/vendor/` holds the site's third-party dependencies, served from our own
origin rather than a CDN: React and ReactDOM 18.3.1, and the Lilita One / Nunito
webfonts with `fonts.css`. Nothing on the site reaches out to a third-party host
at runtime, so no outage or tracking domain can affect it. The Babel standalone
transpiler is gone — the prerender needs no JSX at runtime.

See `README-DEPLOY.md` for the build's own notes.

### `brand-assets/`

Full-resolution source material — original photography, packaging renders and
label artwork. Kept for future design work and deliberately excluded from the
deploy: Netlify publishes `site/` only, so nothing here reaches the web.

```
labels-stickers/          SVG labels, hang tags, belly bands, seals
web-pics/                 Product photography by category
sourdough-web-build/      Sourdough shoot, badges, packaging mockups
whatsapp-product-images/  Product photos
```

## Deploying to Netlify

Connect the repository and Netlify reads `netlify.toml` — no manual settings
needed. For reference, the effective configuration is:

- **Publish directory:** `site`
- **Build command:** `node tools/set-site-url.mjs`

The build command runs `tools/set-site-url.mjs`, which stamps the deploy's real
address into `robots.txt` and `sitemap.xml`. Those files need absolute URLs but
the address isn't known until Netlify assigns one — and changes again when a
custom domain is attached — so the placeholder domain committed here is
replaced at build time from Netlify's environment. Deploy previews and branch
builds additionally get a `Disallow: /` robots.txt so they don't compete with
production in search results.

`netlify.toml` also sets long cache lifetimes on the image and font
directories, keeps HTML and JS revalidating so content changes appear
immediately, and applies baseline security headers. Netlify serves `404.html`
for unknown paths automatically.

## Before launch

- Paste an analytics snippet where each page's `<head>` says
  `<!-- Analytics: ... -->`.
- Checkout is a **prototype**: it renders a confirmation only. No order is
  transmitted and no payment is taken.
- Frozen and boxed retail prices in `site/custom-order.js` (`RETAIL`) are
  placeholders pending the real price sheet.
