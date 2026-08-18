/* Bliss & Butter — hydration.
 *
 * The page it runs in is already finished: both breakpoint trees ship
 * prerendered and styled, and a media query picks the one to show. Nothing here
 * affects how the page looks. All it does is bring behaviour to it — cart, nav
 * drawer, carousels, search, builder, checkout — by mounting the live component
 * tree over the top of the identical static one.
 *
 * If this file is blocked, fails, or arrives late, the visitor keeps the
 * prerendered page. That is the whole point of the packaging: appearance never
 * depends on script execution.
 */
(function () {
  var me = document.currentScript || document.querySelector('script[data-tpl]');
  var tplUrl = me && me.getAttribute('data-tpl');
  var stat = document.getElementById('bb-static');
  var live = document.getElementById('bb-live');
  if (!tplUrl || !stat || !live) return;

  function loadRuntime() {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'dc-runtime.js';
      s.onload = res;
      s.onerror = function () { rej(new Error('dc-runtime.js failed')); };
      document.head.appendChild(s);
    });
  }

  fetch(tplUrl).then(function (r) {
    if (!r.ok) throw new Error('template HTTP ' + r.status);
    return r.text();
  }).then(function (src) {
    var open = /<x-dc(?:\s[^>]*)?>/.exec(src);
    var close = src.lastIndexOf('</' + 'x-dc>');
    if (!open || close < 0) throw new Error('template block not found');
    var host = document.createElement('x-dc');
    host.innerHTML = src.slice(open.index + open[0].length, close);
    live.appendChild(host);
    var logic = /<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src);
    if (logic) {
      var s = document.createElement('script');
      s.type = 'text/x-dc';
      s.setAttribute('data-dc-script', '');
      s.textContent = logic[1];
      live.appendChild(s);
    }
    return loadRuntime();
  }).then(function () {
    var t0 = Date.now();
    (function settle() {
      var root = document.getElementById('dc-root');
      if (root && root.firstElementChild) {
        live.removeAttribute('hidden');
        stat.setAttribute('hidden', '');
        document.documentElement.setAttribute('data-bb-hydrated', '1');
        return;
      }
      if (Date.now() - t0 < 15000) setTimeout(settle, 60);
    })();
  }).catch(function (err) {
    // Static page stays exactly as served.
    if (window.console) console.warn('[bb] not hydrated:', err && err.message);
  });
})();
