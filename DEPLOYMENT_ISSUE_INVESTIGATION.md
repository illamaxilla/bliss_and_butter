# Deployed Site Styling Bug — investigation and resolution

Live site: https://blissandbutter.netlify.app (Netlify, deployed from `main`)

## The problem

Interactive elements on the live site — mobile nav links, "ORDER NOW"/"CUSTOM ORDER"
buttons, category filter chips — render as plain unstyled text (wrong font, no
color, no background/border/padding/shadow) instead of their designed bold
display font + colored pill/button appearance. Static content (headings, body
text, some buttons) renders fine.

Reproducible for the site owner on desktop Chrome (normal + incognito) and on
two iPhones via Safari, through an iMessage tap, a typed URL and a WhatsApp
link alike.

## Why this keeps happening: the design is a runtime artifact

None of these pages ship finished HTML. Each page carries its template source
inside `<x-dc>`, `base.css` hides that block, and `support.js` loads React in
the visitor's browser, compiles the template there, and renders it. **Every
colour, font, border, radius and shadow on this site is an inline `style`
attribute that React writes at runtime.** Nothing on the page has a fallback
appearance in a stylesheet.

That is the whole reason this class of bug recurs. Anything that interferes
between "correct bytes served" and "React finished writing style attributes" —
a delayed or partial render, an extension or in-app browser rewriting the DOM,
an engine-specific hiccup in the style pipeline — strips the appearance off
elements whose markup is perfectly correct. It matches the reported symptom
exactly, including the `font-family: 0` signature: a `style` attribute that
holds one unparseable declaration and nothing else is what you see when the
authored declarations never arrived.

## What this session established

Verified directly, by running the repo through real headless Chromium against a
local server, desktop and iPhone-emulated, at `/` and at `/index.html`, across
all five pages and through the actual interactions (opening the mobile drawer,
category chips):

- **The rendering pipeline is correct.** Every one of the named failing
  elements — drawer nav links, ORDER NOW, CUSTOM ORDER, filter chips — comes out
  with its full authored inline style. 886 styled elements on the home page,
  zero degenerate ones. No console errors.
- **The templates are clean.** All five pages and all four `.dc.html`
  components were checked for the specific ways this runtime's compiler can
  corrupt a template (its camelCase-attribute rewrite firing inside expressions,
  duplicate `style` attributes, whole-attribute `{{ }}` bindings on style). None
  are present.
- **React's SRI hashes match the vendored files**, so the scripts are not being
  blocked by integrity failure.
- **No `font-family: 0` can be produced from this source by this code.** The
  failing elements' styles are static strings with no bindings; there is no path
  through `cssToObj` / `collectProps` / `walkElement` that turns one into a
  single garbage declaration. Whatever produces it does so after, or instead of,
  the normal render.

Two things could *not* be checked from this environment and remain open: the
live site itself (outbound HTTPS to `blissandbutter.netlify.app` is blocked by
this session's network policy) and a real WebKit engine (Playwright's WebKit
build could not be downloaded, also blocked).

## What was found that is genuinely wrong

**The page is blank for a very long time on a phone, and renders in stages.**
`support.js` loads React itself, so the browser cannot discover React while
parsing `<head>`. It instead queues every image it finds in the raw `<x-dc>`
template first, and React lands behind roughly thirty image requests. Measured
on an emulated Fast-3G iPhone: **12.9 seconds** from navigation to the first
rendered element. Then the mobile component (`home-mobile.dc.html`, 103 KB) is
fetched, and then the page source is re-fetched (196 KB) and the whole template
recompiled — each stage seconds apart on a real phone connection. A visitor
looking at the page during that window sees exactly "some things styled, some
things plain".

This is fixed below, and it is the one confirmed defect that plausibly accounts
for the phone reports on its own.

## What shipped

**1. `site/style-guard.js` — a safety net that makes the symptom impossible.**

The runtime stamps every rendered element with `data-dc-tpl` and exposes the
annotated template through `window.__dcAnnotatedTemplate(name)`, so the style
each element *should* carry can be looked up after the fact. The guard walks the
live DOM, compares each element against its own template node, and re-applies
any statically-authored declaration that is missing — on load, and again
whenever the tree changes, so drawers and sheets are covered as they mount.

It only writes properties that are absent, and only ones authored without a
`{{ }}` binding, so it can never fight React over a value React is managing. It
verifies tag and ancestry before touching anything, and waits for the tree to
settle so it never compares a fresh template against a half-updated DOM.

Verified: **zero declarations written across all five pages, desktop and
mobile** — no behaviour change when things work. With the reported failure
injected (styles replaced by `font-family: 0` on the nav links and both ORDER
NOW buttons), it restored all 91 declarations and the elements returned to the
display font and yellow pills.

`window.__bbStyleGuard.repaired` counts what it had to fix, which also turns the
guard into the detector this investigation lacked: a non-zero count on a real
visitor's device is proof the runtime is not delivering the authored styling
there.

**2. React preload hints on every page.** `<link rel="preload" as="script">` for
`react` and `react-dom`, carrying the same SRI hashes so the preloaded response
is actually reused. First render on emulated Fast 3G: **12.9s → 4.6s**.

**3. `site/diag.html` — a one-tap diagnostic for the affected devices.**

Dependency-free: no React, no `support.js`, no webfonts, so it still works when
the thing it measures is broken. Open it on a failing phone and it reports, for
that device:

- the user agent, viewport, and whether the browser supports what the runtime needs;
- whether `index.html`, `home-mobile.dc.html`, `support.js`, `base.css` and both
  React files arrived intact, with byte counts (catches anything on the network
  path altering responses);
- whether React loaded and the runtime booted;
- **every `<script src>` in the page that is not ours** — this is what identifies
  an extension, content blocker, in-app browser or security product injecting
  into the page, which is what the `elephant.js` / `injectNotificationScript.js`
  files seen in the desktop Network tab pointed at;
- the actual `style` attribute and computed font of a real rendered element;
- how many declarations the style guard had to repair, and any script errors.

It prints a plain-English verdict at the top. Screenshot it.

## What to do next

1. Deploy and reload the site on an affected phone. The guard should make the
   symptom disappear regardless of cause.
2. Open `https://blissandbutter.netlify.app/diag.html` on that phone and
   screenshot the verdict. That says which of the remaining explanations is real:
   a foreign script injected into the page, a file altered in transit, or the
   runtime genuinely failing to apply styles on that device.
3. If the verdict names foreign scripts, the cause is client-side software on
   those devices — check Safari → Extensions and any content blocker or VPN /
   security app, and retest with them off.

## The durable fix, if this recurs

The underlying fragility is that appearance is computed at runtime, per visitor.
The permanent answer is to stop shipping raw templates: prerender each page to
real HTML at build time (Netlify already runs a Node build command) and keep
React only for interactivity, so a visitor always has correctly styled markup
even if the runtime never starts. That is a larger change than this one and is
worth doing deliberately rather than under a live bug.

## Ruled out in earlier sessions (unchanged)

Fonts load 200 OK; deployed HTML and `support.js` match the repo byte-for-byte;
no Netlify Snippet Injection; no service worker or offline cache; no CSP header;
`main` and the deploys are in sync; the earlier `cursive`-fallback bug is fixed
and stayed fixed.
