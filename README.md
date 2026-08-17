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
- **Build command:** none

`netlify.toml` also sets long cache lifetimes on the image directories, keeps
HTML and JS revalidating so content changes appear immediately, and applies
baseline security headers. Netlify serves `404.html` for unknown paths
automatically.

## Before launch

- Replace the placeholder domain `blissandbutter.com` in `site/robots.txt` and
  `site/sitemap.xml` with the real domain.
- Paste an analytics snippet where each page's `<head>` says
  `<!-- Analytics: ... -->`.
- Checkout is a **prototype**: it renders a confirmation only. No order is
  transmitted and no payment is taken.
- Frozen and boxed retail prices in `site/custom-order.js` (`RETAIL`) are
  placeholders pending the real price sheet.
