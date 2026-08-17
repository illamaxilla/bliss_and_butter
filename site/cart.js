(function () {
  var KEY = 'bb-cart-v1';
  var listeners = new Set();
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    listeners.forEach(function (fn) { try { fn(items); } catch (e) {} });
  }
  function add(item, qty) {
    qty = qty || 1;
    var items = read();
    var ex = items.find(function (i) { return i.id === item.id; });
    if (ex) ex.qty += qty;
    else items.push({ id: item.id, name: item.name, price: item.price, cat: item.cat, slug: item.slug, meta: item.meta || '', img: item.img || '', qty: qty });
    write(items);
    showToast(item, qty);
  }
  function showToast(item, qty) {
    try {
      var host = document.getElementById('bb-toast');
      if (!host) {
        host = document.createElement('div');
        host.id = 'bb-toast';
        host.style.cssText = 'position:fixed;left:50%;bottom:30px;z-index:4000;transform:translateX(-50%) translateY(22px);opacity:0;transition:opacity .28s ease,transform .28s cubic-bezier(.2,1.2,.3,1);pointer-events:none;font-family:"Lilita One","Arial Black",sans-serif;';
        document.body.appendChild(host);
      }
      var nm = (item && item.name) ? item.name : 'Item';
      host.innerHTML = '<div style="display:flex;align-items:center;gap:12px;background:#FFFCF8;border:2.5px solid #2D1B14;border-radius:44px;padding:12px 24px 12px 14px;box-shadow:3px 5px 0 #2D1B14;">'
        + '<span style="display:flex;width:34px;height:34px;border-radius:50%;background:#2E7D46;align-items:center;justify-content:center;flex-shrink:0;">'
        + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>'
        + '<span style="font-size:16px;color:#2D1B14;letter-spacing:.3px;">Added ' + (qty > 1 ? qty + '\u00d7 ' : '') + nm + '</span></div>';
      requestAnimationFrame(function () { host.style.opacity = '1'; host.style.transform = 'translateX(-50%) translateY(0)'; });
      clearTimeout(host._t);
      host._t = setTimeout(function () { host.style.opacity = '0'; host.style.transform = 'translateX(-50%) translateY(22px)'; }, 2200);
    } catch (e) {}
  }
  function setQty(id, qty) {
    var items = read();
    if (qty <= 0) { items = items.filter(function (i) { return i.id !== id; }); }
    else { var it = items.find(function (i) { return i.id === id; }); if (it) it.qty = qty; }
    write(items);
  }
  function remove(id) { write(read().filter(function (i) { return i.id !== id; })); }
  function clear() { write([]); }
  function count() { return read().reduce(function (s, i) { return s + i.qty; }, 0); }
  function total() { return read().reduce(function (s, i) { return s + i.price * i.qty; }, 0); }
  function subscribe(fn) { listeners.add(fn); return function () { listeners.delete(fn); }; }
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) listeners.forEach(function (fn) { try { fn(read()); } catch (_) {} });
  });
  window.BBCart = { read: read, add: add, setQty: setQty, remove: remove, clear: clear, count: count, total: total, subscribe: subscribe };
})();
