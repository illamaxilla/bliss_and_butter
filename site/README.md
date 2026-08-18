# Bliss & Butter — deployment build

Static site. No build step, no server code: upload this folder as-is to any static host
(Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, GitHub Pages).

## Pages
| URL | File | Notes |
|---|---|---|
| / | index.html | Home |
| /menu.html | menu.html | Menu, rotating category |
| /product.html | product.html | Shop + product detail (?category=&product=) |
| /custom-order.html | custom-order.html | Custom order builder |
| /checkout.html | checkout.html | Cart, slots, order confirmation (demo only) |
| 404 | 404.html | Point the host's not-found handler here |

Each page renders desktop above 900px and mounts its mobile build below it
(`*-mobile.dc.html`) — those are components, not pages; don't link to them directly.

## Shared scripts
`cart.js` (cart state, localStorage) · `products.js` (catalog) · `catalog.js` ·
`product-images.js` (image registry) · `custom-order.js` (builder catalog + request handoff) ·
`search.js` · `image-slot.js` · `support.js` (component runtime) ·
`style-guard.js` (restores inline styles the runtime fails to apply).

## How a page actually renders

Worth knowing before debugging anything visual: none of these pages ship
finished HTML. Each one carries its template inside `<x-dc>`, which `base.css`
hides, and `support.js` loads React, compiles that template in the visitor's
browser and renders it. Every colour, font, border and shadow on the site is an
inline `style` attribute that React writes at runtime — so if the runtime is
delayed, interfered with, or fails partway, elements appear as bare unstyled
text even though the markup is perfect. `style-guard.js` exists to catch that;
see the comment at the top of the file.

Two things follow from this that are easy to trip over:

- **React is loaded by `support.js`, not by the page.** The browser cannot see
  those two files while parsing `<head>`, so each page carries `<link
  rel="preload">` hints for them. Without the hints the browser queues every
  image it finds in the raw template first and the page stays blank for many
  seconds on a phone connection (measured: 12.9s to first paint versus 4.6s
  with them, on emulated Fast 3G).
- **Those preloads and `support.js` both pin React's SRI hash.** If you ever
  replace `vendor/react*.js`, recompute the hashes (`openssl dgst -sha384
  -binary <file> | openssl base64 -A`) and update them in `support.js` *and* in
  every page's preload tag, or the scripts are blocked and the site renders
  nothing at all.

## Diagnosing a broken render

Open `/diag.html` on the affected device. It uses none of the machinery above,
runs the real page in a hidden frame, and reports what happened there: whether
React loaded, whether the files arrived intact, whether any script that is not
ours was injected into the page, and how many style declarations the guard had
to restore. Screenshot it.

## Before launch
- Replace `blissandbutter.com` in `robots.txt` and `sitemap.xml` with the real domain.
- Paste an analytics snippet where each page's head says `<!-- Analytics: ... -->`.
- Orders are a prototype confirmation only — nothing is sent anywhere and no payment is taken.
- Frozen and boxed retail prices in `custom-order.js` (RETAIL) are placeholders pending the real price sheet.
