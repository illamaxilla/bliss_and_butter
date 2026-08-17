# Bliss & Butter

Marketing and ordering site for Bliss & Butter, plus the brand asset library.

## Repository layout

```
site/            The deployed website — this is what Netlify publishes
brand-assets/    Source artwork and photography (not deployed)
netlify.toml     Netlify build & header configuration
```

### `site/`

A static site: plain HTML, CSS and JavaScript with **no build step**. Pages sit
at the root alongside the image folders they reference, because every image path
in the markup is relative (`uploads/…`, `packaging/…`). Keeping that shape is
what makes the images resolve — moving the pages or the image folders apart
breaks them.

| URL | File |
|---|---|
| `/` | `index.html` |
| `/menu.html` | `menu.html` |
| `/product.html` | `product.html` (`?category=&product=`) |
| `/custom-order.html` | `custom-order.html` |
| `/checkout.html` | `checkout.html` |
| not found | `404.html` |

Each page renders a desktop layout above 900px and mounts a mobile build below
it. Those mobile builds are the `*-mobile.dc.html` files — they are components
fetched at runtime, not pages, so nothing should link to them directly.

Shared scripts: `cart.js` (cart state in localStorage) · `products.js` and
`catalog.js` (catalog data) · `product-images.js` (image registry) ·
`custom-order.js` (builder catalog) · `search.js` · `image-slot.js` ·
`support.js` (component runtime).

`site/vendor/` holds the site's third-party dependencies, served from our own
origin rather than a CDN: React and ReactDOM 18.3.1 (loaded by `support.js`
with the same SRI hashes the CDN build used), Babel standalone 7.26.4, and the
Lilita One / Nunito webfonts with `fonts.css`. Nothing on the site reaches out
to a third-party host at runtime, so no outage or tracking domain can affect
it. Babel is only fetched if a page uses `x-import` with JSX — no page does
today, so in practice it never loads.

See `site/README.md` for the build's own notes.

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
