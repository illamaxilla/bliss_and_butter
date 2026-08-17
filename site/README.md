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
`search.js` · `image-slot.js` · `support.js` (component runtime).

## Before launch
- Replace `blissandbutter.com` in `robots.txt` and `sitemap.xml` with the real domain.
- Paste an analytics snippet where each page's head says `<!-- Analytics: ... -->`.
- Orders are a prototype confirmation only — nothing is sent anywhere and no payment is taken.
- Frozen and boxed retail prices in `custom-order.js` (RETAIL) are placeholders pending the real price sheet.
