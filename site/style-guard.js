/* Bliss & Butter — inline-style guard.
 *
 * Why this exists
 * ---------------
 * Every visual property on this site is written as an inline `style` attribute
 * in the template source, and those attributes only reach the page because
 * support.js compiles the template and React writes them out at runtime. That
 * makes the design a *runtime* artifact: anything that interferes with the
 * template between "served bytes" and "painted pixels" — a browser extension
 * or in-app browser that rewrites the DOM, an engine quirk in the style
 * pipeline, a partial render — silently strips the appearance off elements
 * whose markup is perfectly correct. The reported symptom (nav links, ORDER
 * NOW / CUSTOM ORDER buttons and filter chips rendering as bare text) is
 * exactly that failure shape.
 *
 * What this does
 * --------------
 * The runtime stamps every template node with `data-dc-tpl` and exposes the
 * annotated template through `window.__dcAnnotatedTemplate(name)`, so the
 * authored style for any rendered element can be looked up after the fact.
 * This walks the live DOM, compares each element against the style its own
 * template node declares, and re-applies any declaration that went missing.
 *
 * It is a safety net, not a renderer. When everything works it finds nothing
 * and changes nothing — React has already written the same declarations. It
 * only writes properties that are authored statically (no `{{ }}` binding) and
 * only when they are absent from the element, so it can never fight React over
 * a value React is actively managing.
 *
 * `window.__bbStyleGuard.repaired` counts what it had to fix. A non-zero count
 * on a real visitor's device is the proof that the runtime is not delivering
 * the authored styling there; diag.html reads it.
 */
(function () {
  'use strict';

  var state = {
    repaired: 0,      // declarations restored since load
    elements: 0,      // elements touched since load
    passes: 0,
    lastDetail: [],   // small sample of what was repaired, for diag.html
    ready: false
  };
  window.__bbStyleGuard = state;

  // tplId -> { tag: 'a', decls: [[prop, value], ...] }, per component name.
  // Cached against the annotated-template string so a recompile invalidates it.
  var maps = Object.create(null);

  // Script errors are the other half of the picture: if the runtime threw on a
  // visitor's browser, the styles it never wrote are a symptom rather than the
  // cause. diag.html reads this list off a real device.
  state.errors = [];
  function note(msg) {
    if (state.errors.length < 20) state.errors.push(String(msg).slice(0, 300));
  }
  window.addEventListener('error', function (e) {
    note((e.message || 'error') + ' @ ' + (e.filename || '?') + ':' + (e.lineno || 0));
  });
  window.addEventListener('unhandledrejection', function (e) {
    note('unhandled rejection: ' + ((e.reason && e.reason.message) || e.reason));
  });

  function parseDecls(css) {
    var out = [];
    var parts = css.split(';');
    for (var i = 0; i < parts.length; i++) {
      var d = parts[i];
      var c = d.indexOf(':');
      if (c < 0) continue;
      var prop = d.slice(0, c).trim();
      var val = d.slice(c + 1).trim();
      // Dynamic values are the runtime's business, not ours.
      if (!prop || !val || prop.indexOf('{{') >= 0 || val.indexOf('{{') >= 0) continue;
      out.push([prop, val]);
    }
    return out;
  }

  // A template id alone is not proof of identity: the runtime compiles the page
  // twice (once from the parsed DOM, once from the re-fetched source) and the
  // ids are positional, so a sweep that lands between the two could otherwise
  // match an element against a different node that happens to share an id.
  // Comparing a short slice of ancestry as well makes that effectively
  // impossible, and a mismatch simply means this element is left alone.
  function chainOf(node) {
    var out = [];
    var p = node.parentElement;
    for (var i = 0; i < 2 && p; i++) {
      out.push(p.localName + '#' + (p.getAttribute('data-dc-tpl') || ''));
      p = p.parentElement;
    }
    return out.join('>');
  }

  function aligned(el, want) {
    if (want.tag !== el.localName) return false;
    // Template ancestry stops at the template fragment; DOM ancestry stops at
    // the component host. Compare only as far as both actually go.
    var mine = chainOf(el);
    if (!want.chain) return true;
    return mine.indexOf(want.chain) === 0 || want.chain.indexOf(mine) === 0;
  }

  function buildMap(name) {
    var ann;
    try {
      ann = window.__dcAnnotatedTemplate(name);
    } catch (e) {
      ann = null;
    }
    if (!ann) return null;
    var cached = maps[name];
    if (cached && cached.src === ann) return cached.byId;

    var tpl = document.createElement('template');
    tpl.innerHTML = ann;
    var byId = Object.create(null);
    var nodes = tpl.content.querySelectorAll('[data-dc-tpl][style]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var decls = parseDecls(el.getAttribute('style') || '');
      if (!decls.length) continue;
      byId[el.getAttribute('data-dc-tpl')] = {
        tag: el.localName,
        // Two levels of ancestry, used to confirm a rendered element really is
        // the node this template entry describes before anything is written.
        chain: chainOf(el),
        decls: decls
      };
    }
    maps[name] = { src: ann, byId: byId };
    return byId;
  }

  function repair(el, want) {
    // Only restore declarations the element is actually missing. A property
    // that failed to parse (the `font-family: 0` signature) reads back as ''
    // from CSSOM, so it is caught here the same as one that never arrived.
    var fixed = 0;
    for (var i = 0; i < want.decls.length; i++) {
      var prop = want.decls[i][0];
      var val = want.decls[i][1];
      if (el.style.getPropertyValue(prop) !== '') continue;
      try {
        el.style.setProperty(prop, val);
      } catch (e) {
        continue;
      }
      if (el.style.getPropertyValue(prop) !== '') fixed++;
    }
    if (fixed) {
      state.repaired += fixed;
      state.elements++;
      if (state.lastDetail.length < 12) {
        state.lastDetail.push(
          el.localName + '[' + el.getAttribute('data-dc-tpl') + '] "' +
          (el.textContent || '').trim().slice(0, 24) + '" +' + fixed
        );
      }
    }
  }

  function sweep() {
    var root = document.getElementById('dc-root');
    if (!root) return;
    state.passes++;
    var hosts = root.querySelectorAll('.sc-host[data-sc-name]');
    for (var h = 0; h < hosts.length; h++) {
      var host = hosts[h];
      var byId = buildMap(host.getAttribute('data-sc-name'));
      if (!byId) continue;
      var els = host.querySelectorAll('[data-dc-tpl]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        // Elements emitted by a nested component belong to that component's
        // template, not this one — its own host handles them.
        if (el.closest('.sc-host[data-sc-name]') !== host) continue;
        var want = byId[el.getAttribute('data-dc-tpl')];
        if (!want || !aligned(el, want)) continue;
        repair(el, want);
      }
    }
    state.ready = true;
  }

  // Wait for the tree to go quiet before looking at it. React renders in
  // batches and the runtime recompiles the template once the page source has
  // been re-fetched, so a sweep taken mid-flight would be comparing a settled
  // template against a half-updated DOM.
  var SETTLE_MS = 300;
  var timer = null;
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      try {
        sweep();
      } catch (e) {
        /* never let the guard break the page */
      }
    }, SETTLE_MS);
  }

  function start() {
    if (!document.getElementById('dc-root')) {
      // React has not mounted yet; keep looking for a while, then give up.
      if (start.tries === undefined) start.tries = 0;
      if (++start.tries > 200) return;
      setTimeout(start, 50);
      return;
    }
    schedule();
    // Re-check whenever the tree changes: menus and sheets mount on demand, and
    // anything that strips a style attribute after the fact shows up here too.
    try {
      new MutationObserver(schedule).observe(document.getElementById('dc-root'), {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
      });
    } catch (e) {
      setInterval(schedule, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
