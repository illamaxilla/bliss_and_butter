# Deployed Site Styling Bug — Investigation Summary

Live site: https://blissandbutter.netlify.app (Netlify, deployed from `main`)

## The problem

Interactive elements on the live site — mobile nav links, "ORDER NOW"/"CUSTOM ORDER"
buttons, category filter chips — render as plain unstyled text (wrong font, no
color, no background/border/padding/shadow) instead of their designed bold
display font + colored pill/button appearance. Static content (headings, body
text, some buttons) renders fine.

Confirmed reproducible on: desktop Chrome (normal + incognito), and 2 different
iPhones via Safari — tested via iMessage tap, direct URL typed into the browser,
and a WhatsApp-shared link. Same result every time.

## What was verified correct (ruled out)

- **Fonts load fine** — self-hosted Lilita One/Nunito, 200 OK, served from cache, fast.
- **Deployed HTML template files match the repo exactly**, byte-for-byte (checked
  via Network tab "Response" content).
- **Deployed `support.js`** (the client-side rendering engine for this site)
  **matches the repo exactly** — verified specific function source present
  verbatim in the live file.
- **Local reproduction fails to reproduce the bug** — served the exact repo
  files from a clean local static server, loaded in real headless Chromium
  (including full iPhone device emulation: viewport, touch, user agent),
  clicked through the same interactions, and every element renders perfectly,
  every time, across 3 separate test runs.
- **No Netlify Snippet Injection configured** (checked the Netlify dashboard — empty).
- **No service worker, no localStorage/indexedDB/Cache API usage** in the
  codebase that could be serving stale cached content.
- **No Content-Security-Policy header** on the live document (checked Response
  Headers directly).
- **`main` branch and deploys are in sync** — Netlify's deploy log confirms
  every relevant commit (including earlier font/rendering fixes) deployed
  successfully; this is not a stale-branch or failed-deploy issue.
- **Not the earlier known bug** (a `cursive` generic font fallback resolving
  to serif) — that was already fixed in a prior session and the fix is
  confirmed live and correct.

## What was found but not fully explained

- **The exact failure signature**, inspected directly on a live broken
  element: its applied inline style collapses to a single garbage
  declaration (`font-family: 0;`), wiping out every other authored style
  property. The source markup itself is correctly authored — this is a
  rendering/application failure, not a content bug.
- **Not confined to one rendering path** — it hits both the client-rendered
  mobile nav component and at least one plain anchor in the main desktop
  page ("CUSTOM ORDER" in the top bar), so it's broader than one component.
- **On the desktop debugging session**, the Network tab showed multiple
  browser-extension-injected scripts running alongside the site's own files —
  filenames like `elephant.js`, `injectNotificationScript.js`,
  `meetExtensionContextInvalidated...`, `shadowDom-...`,
  `waitForPageSettled-...`, none of which belong to this codebase (all 8 real
  script files are accounted for). This strongly suggests an active browser
  extension (possibly an AI browsing assistant or similar) manipulating the
  page on that session — but this alone doesn't explain the phones, and
  extensions/antivirus/in-app-browser injection were separately ruled out on
  the phones (iMessage, WhatsApp, and direct URL entry all fail identically).
- **Untested, still-open possibility:** the site was never tested in an
  actual Safari/WebKit engine — only Chromium was available for local
  testing. Two iOS-specific mechanisms remain unconfirmed on the affected
  phones: **Lockdown Mode** (Settings → Privacy & Security) and **installed
  Safari Extensions/content blockers** — both could plausibly interfere with
  the dynamic JavaScript execution this site's rendering engine depends on.

## Technical context

The site's interactive components (`.dc.html` files) are not pre-built
static HTML — they're raw "Design Component" template source (JSX-like
syntax with `{{ }}` bindings), and `site/support.js` (~1,600 lines) is a
runtime that loads React + Babel **in the visitor's browser** and
renders/transpiles them live on every page load. This is inherently more
fragile than static HTML and is the likely reason similar bugs have
recurred across multiple fix attempts.

Relevant files:
- `site/support.js` — see `cssToObj`, `collectProps`, `walkElement` around
  lines 350–430 and 665–685 for the style-application pipeline.
- `site/base.css`
- `site/home-mobile.dc.html` — nav menu, lines ~30–54.
- `site/index.html` — "CUSTOM ORDER" link, line ~358.
- `netlify.toml`

## Assessment

Every artifact inspectable remotely (served files, deployed JS, deploy
history, headers, config) checks out correct, and the bug could not be
reproduced in any local test. Yet it is real and consistent for the site
owner across three access methods on two phones plus desktop. No definitive
root cause was pinned down. Most likely remaining explanations, in rough
order of confidence:

1. Something specific to Safari/WebKit execution of this custom runtime,
   untestable from the environment this investigation was done in.
2. A genuine but hard-to-reproduce race condition or bug in the client-side
   rendering engine that only manifests under real-world timing/network
   conditions a clean test environment doesn't replicate.
3. Residual extension/security-software interference not yet fully ruled
   out on the phones (Lockdown Mode, Safari extensions, MDM profile).

**Strongest recommendation regardless of root cause:** use Safari's Web
Inspector (connect an iPhone to a Mac via USB, use Safari → Develop menu) to
get real DevTools access on an actual failing device — this would show
WebKit-specific console errors and computed styles the way Chrome DevTools
did on desktop, which was the one diagnostic angle not reachable during this
investigation.
