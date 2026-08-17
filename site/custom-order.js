/* Bliss & Butter — custom order builder shared data + request handoff.
 * Catalog is DERIVED from products.js (window.BBProducts) so the builder can't
 * drift from the site catalog. Money rules that belong to checkout (promo, tax,
 * delivery fee) deliberately live ONLY in Checkout — this file never discounts.
 * Loaded by Custom Order.dc.html and Custom Order Mobile.dc.html. */
(function () {
  var KEY = 'bb-custom-request-v1';
  var LEAD_DAYS = 2;              // 48 hours notice on custom orders
  var FREE_DELIVERY = 40;         // must match Checkout's threshold + site marquee

  var IMG = {
    'choc-chip': 'uploads/choc-chip-cutout.png', 'oatmeal': 'uploads/oatmeal-raisin-cutout.png',
    'oatmeal-choc-chip': 'uploads/oatmeal-choc-chip-cutout.png',
    'double-choc': 'uploads/double-choc-cutout.png', 'peanut-butter': 'uploads/peanut-butter-cutout.png',
    'snickerdoodle': 'uploads/snickerdoodle-cutout.png', 'pb-choc-chip': 'uploads/pb-choc-chip-cutout.png',
    'sourdough': 'uploads/sourdough-cutout.png', 'baguette': 'uploads/baguette-cutout.png',
    'rye': 'uploads/rye-cutout.png', 'ciabatta': 'uploads/ciabatta-cutout.png', 'brioche': 'uploads/brioche-cutout.png',
    'croissant': 'uploads/croissant-cutout.png', 'pain-au-chocolat': 'uploads/pain-choc-cutout.png',
    'almond-croissant': 'uploads/almond-croissant-cutout.png', 'danish': 'uploads/danish-cutout.png',
    'cinnamon-roll': 'uploads/cinnamon-roll-cutout.png',
    'apple': 'uploads/apple-pie-cutout.png', 'cherry': 'uploads/cherry-pie-cutout.png',
    'pumpkin': 'uploads/pumpkin-pie-cutout.png', 'pecan': 'uploads/pecan-pie-cutout.png',
    'key-lime': 'uploads/keylime-pie-cutout.png',
    'plain': 'uploads/vanilla-cake-cutout.png', 'red-velvet': 'uploads/red-velvet-cutout.png',
    'carrot': 'uploads/carrot-cake-cutout.png', 'chocolate': 'uploads/chocolate-cake-cutout.png',
    'lemon': 'uploads/lemon-cake-cutout.png',
  };

  /* Packaged-product shot per SKU (from the packaging line) — second image in the gallery. */
  var PACK = {
    'choc-chip': 'packaging/rS-box-v2-choc-chip.png', 'oatmeal': 'packaging/rS-box-v2-oatmeal-raisin.png',
    'oatmeal-choc-chip': 'packaging/rS-box-v2-oatmeal-choc-chip.png', 'double-choc': 'packaging/rS-box-double-choc.png',
    'peanut-butter': 'packaging/rS-box-v2-peanut-butter.png', 'pb-choc-chip': 'packaging/rS-box-v2-pb-choc-chip.png',
    'snickerdoodle': 'packaging/rS-box-snickerdoodle.png',
    'sourdough': 'packaging/rB-bread-boule-halfwrap.png', 'baguette': 'packaging/rB-bread-baguette-sleeve.png',
    'rye': 'packaging/rB-bread-rye-gusseted.png', 'ciabatta': 'packaging/rB-bread-ciabatta-halfwrap.png',
    'brioche': 'packaging/rB-bread-gusseted-bag.png',
    'croissant': 'packaging/rB-pastry-glassine-sleeve.png', 'pain-au-chocolat': 'packaging/rB-pastry-pain-au-chocolat.png',
    'almond-croissant': 'packaging/rB-pastry-almond-croissant.png', 'danish': 'packaging/rB-pastry-danish-cup.png',
    'cinnamon-roll': 'packaging/rB-pastry-roll-cup.png',
    'apple': 'packaging/rB-pie-apple-box.png', 'cherry': 'packaging/rB-pie-cherry-box.png',
    'pumpkin': 'packaging/rB-pie-pumpkin-box.png', 'pecan': 'packaging/rB-pie-pecan-lattice.png',
    'key-lime': 'packaging/rB-pie-keylime-box.png',
    'plain': 'packaging/rB-cake-vanilla.png', 'red-velvet': 'packaging/rB-cake-red-velvet.png',
    'carrot': 'packaging/rB-cake-carrot.png', 'chocolate': 'packaging/rB-cake-chocolate.png',
    'lemon': 'packaging/rB-cake-lemon-loaf.png',
  };

  /* Retail SKUs — packaged lines that are not in products.js (boxed singles + frozen formats).
   * Prices marked PLACEHOLDER need the real retail sheet before launch. */
  var RETAIL = {
    boxed: [
      { slug: 'box-choc-chip', name: 'CHOCOLATE CHIP BOX', price: 4.50, desc: 'One soft-baked cookie, boxed and sealed with a film label.', img: 'packaging/rS-box-v2-choc-chip.png' },
      { slug: 'box-oatmeal-choc-chip', name: 'OATMEAL CHOC CHIP BOX', price: 4.50, desc: 'Rolled oats and dark chocolate, boxed for the counter.', img: 'packaging/rS-box-v2-oatmeal-choc-chip.png' },
      { slug: 'box-oatmeal-raisin', name: 'OATMEAL RAISIN BOX', price: 4.50, desc: 'Cinnamon oat dough with plump raisins, single boxed.', img: 'packaging/rS-box-v2-oatmeal-raisin.png' },
      { slug: 'box-double-choc', name: 'DOUBLE CHOCOLATE BOX', price: 4.75, desc: 'Deep cocoa dough with dark and milk chunks, single boxed.', img: 'packaging/rS-box-double-choc.png' },
      { slug: 'box-peanut-butter', name: 'PEANUT BUTTER BOX', price: 4.50, desc: 'Roasted peanut butter cookie with the classic criss-cross.', img: 'packaging/rS-box-v2-peanut-butter.png' },
      { slug: 'box-pb-choc-chip', name: 'PB CHOCOLATE CHIP BOX', price: 4.75, desc: 'Peanut butter dough, chocolate chips, flaky salt.', img: 'packaging/rS-box-v2-pb-choc-chip.png' },
      { slug: 'box-snickerdoodle', name: 'SNICKERDOODLE BOX', price: 4.50, desc: 'Cinnamon sugar rolled and boxed, plant-based.', img: 'packaging/rS-box-snickerdoodle.png' },
    ],
    frozen: [
      { slug: 'frozen-pouch', name: 'THE POUCH', price: 12.00, desc: 'Portioned frozen dough — bake a few at a time.', img: 'packaging/rT-pouch-v2-choc-chip.png' },
      { slug: 'frozen-tray', name: 'THE TRAY', price: 14.00, desc: 'Bake-in tray in a printed sleeve. No pan to wash.', img: 'packaging/rT-tray-a-sleeve.png' },
      { slug: 'frozen-carton', name: 'THE CARTON', price: 16.00, desc: 'Arch-window carton. Bakes twelve.', img: 'packaging/rG-box-arch-window.png' },
      { slug: 'frozen-log', name: 'THE LOG', price: 13.00, desc: 'Slice and bake as many as you want.', img: 'packaging/rH-log-choc-chip.png' },
      { slug: 'frozen-tub', name: 'THE TUB', price: 15.00, desc: 'Scoop-and-bake tub for the freezer door.', img: 'packaging/rT-tub-v2-choc-chip.png' },
    ],
  };

  /* Gallery for the builder hero: the cutout, its pack, then category photography.
   * `fit` tells the view how to frame it — cutouts sit on the tint, photos fill. */
  function shots(catKey, slug) {
    var out = [];
    if (RETAIL[catKey]) {
      var r = RETAIL[catKey].filter(function (x) { return x.slug === slug; })[0];
      if (r) out.push({ src: r.img, label: 'THE PACK', fit: 'contain' });
      return out;
    }
    if (IMG[slug]) out.push({ src: IMG[slug], label: 'THE BAKE', fit: 'contain' });
    if (PACK[slug]) out.push({ src: PACK[slug], label: 'BOXED', fit: 'contain' });
    out.push({ src: 'uploads/craft-' + catKey + '.jpg', label: 'IN THE BAKERY', fit: 'cover' });
    out.push({ src: 'uploads/spread-' + catKey + '.jpg', label: 'THE SPREAD', fit: 'cover' });
    return out;
  }

  /* Single source for a cart line's thumbnail: cutout, else the retail pack shot, else the pack map. */
  function lineImg(catKey, slug) {
    if (IMG[slug]) return IMG[slug];
    if (RETAIL[catKey]) {
      var r = RETAIL[catKey].filter(function (x) { return x.slug === slug; })[0];
      if (r && r.img) return r.img;
    }
    return PACK[slug] || '';
  }

  var CATS = [
    { key: 'cookies', label: 'COOKIES', dot: '#C6431E', tint: '#F6EAE2' },
    { key: 'bread', label: 'BREAD', dot: '#8A4B2A', tint: '#F4EADF' },
    { key: 'pastries', label: 'PASTRIES', dot: '#E0902A', tint: '#F8EEDD' },
    { key: 'pies', label: 'PIES', dot: '#B0472F', tint: '#F7E9E4' },
    { key: 'cakes', label: 'CAKES', dot: '#A8456B', tint: '#F7E8EC' },
    { key: 'boxed', label: 'BOXED SINGLES', dot: '#C6431E', tint: '#F6EAE2' },
    { key: 'frozen', label: 'READY TO BAKE', dot: '#36A9E1', tint: '#E7F1F6' },
  ];

  var SIZES = {
    cookies: [{ k: '6', label: 'BOX OF 6', mult: 0.55 }, { k: '12', label: 'BOX OF 12', mult: 1 }, { k: '24', label: 'BOX OF 24', mult: 1.85 }],
    bread: [{ k: '1', label: 'SINGLE LOAF', mult: 1 }, { k: '2', label: 'PAIR', mult: 1.9 }, { k: '4', label: 'FOUR-PACK', mult: 3.6 }],
    pastries: [{ k: '4', label: 'BOX OF 4', mult: 4 }, { k: '8', label: 'BOX OF 8', mult: 7.4 }, { k: '12', label: 'BOX OF 12', mult: 10.5 }],
    pies: [{ k: 'mini', label: 'MINIS (4)', mult: 0.48, variantKey: 'mini' }, { k: '9', label: '9-INCH', mult: 1, variantKey: 'whole' }, { k: '11', label: '11-INCH', mult: 1.35 }],
    cakes: [{ k: '6', label: '6-INCH', mult: 0.7 }, { k: '8', label: '8-INCH', mult: 1, variantKey: 'round' }, { k: '10', label: '10-INCH · TIERED', mult: 1.5 }],
    boxed: [{ k: '1', label: 'SINGLE BOX', mult: 1 }, { k: '4', label: 'FOUR-PACK', mult: 3.8 }, { k: '12', label: 'TWELVE-PACK', mult: 10.8 }],
    frozen: [{ k: '1', label: 'ONE', mult: 1 }, { k: '3', label: 'THREE', mult: 2.85 }, { k: '6', label: 'SIX', mult: 5.4 }],
  };

  var ADDINS = {
    cookies: [{ k: 'salt', label: 'Flaky sea salt finish', price: 2 }, { k: 'choc', label: 'Extra chocolate', price: 3.5 }, { k: 'soft', label: 'Under-baked & gooey', price: 0 }, { k: 'ribbon', label: 'Gift ribbon + card', price: 4 }],
    bread: [{ k: 'sliced', label: 'Sliced for us', price: 0 }, { k: 'seeds', label: 'Seeded crust', price: 1.5 }, { k: 'butter', label: 'Cultured butter pat', price: 4 }, { k: 'ribbon', label: 'Gift wrap', price: 3 }],
    pastries: [{ k: 'warm', label: 'Warm at pickup', price: 0 }, { k: 'sugar', label: 'Powdered sugar dusting', price: 1 }, { k: 'mix', label: 'Baker\u2019s mixed box', price: 2.5 }, { k: 'ribbon', label: 'Gift ribbon + card', price: 4 }],
    pies: [{ k: 'lattice', label: 'Lattice top', price: 2 }, { k: 'cream', label: 'Whipped cream tub', price: 5 }, { k: 'warm', label: 'Warm at pickup', price: 0 }, { k: 'ribbon', label: 'Gift box', price: 4 }],
    cakes: [{ k: 'msg', label: 'Piped message', price: 6 }, { k: 'filling', label: 'Extra filling layer', price: 8 }, { k: 'flowers', label: 'Buttercream flowers', price: 12 }, { k: 'candles', label: 'Candles + matches', price: 2 }],
    boxed: [{ k: 'ribbon', label: 'Gift ribbon + card', price: 4 }, { k: 'mixed', label: 'Mix the flavors', price: 0 }, { k: 'sleeve', label: 'Printed gift sleeve', price: 3 }],
    frozen: [{ k: 'ice', label: 'Insulated pack for travel', price: 5 }, { k: 'guide', label: 'Printed baking guide', price: 0 }, { k: 'ribbon', label: 'Gift ribbon + card', price: 4 }],
  };

  function num(v) {
    if (typeof v === 'number') return v;
    var n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  function money(n) { return '$' + n.toFixed(2); }

  function catalog() {
    var P = window.BBProducts || {};
    var out = {};
    CATS.forEach(function (c) {
      if (RETAIL[c.key]) {
        out[c.key] = RETAIL[c.key].map(function (p) {
          return { slug: p.slug, name: p.name, price: p.price, desc: p.desc, variants: null };
        });
        return;
      }
      out[c.key] = (P[c.key] || []).map(function (p) {
        return { slug: p.slug, name: p.name, price: num(p.price), desc: p.desc, variants: p.variants || null };
      });
    });
    return out;
  }

  /* size price: prefer a real variant price from products.js, else the multiplier */
  function sizePrice(item, size) {
    if (item && size && size.variantKey && item.variants) {
      for (var i = 0; i < item.variants.length; i++) {
        if (item.variants[i].key === size.variantKey) return num(item.variants[i].price);
      }
    }
    return num(item && item.price) * (size ? size.mult : 1);
  }

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function minDate() { var d = new Date(); d.setDate(d.getDate() + LEAD_DAYS); return iso(d); }
  function prettyDate(s) {
    if (!s) return '';
    var p = String(s).split('-');
    if (p.length !== 3) return s;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[Number(p[1]) - 1] + ' ' + Number(p[2]) + ', ' + p[0];
  }
  function dateOk(s) { return !!s && s >= minDate(); }

  function save(req) { try { localStorage.setItem(KEY, JSON.stringify(req || {})); } catch (e) {} }
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* Text Checkout drops into its own notes field so the request travels with the order */
  function notesLine(req) {
    if (!req || !req.date) return '';
    var s = 'Custom order — ready by ' + prettyDate(req.date) + ' (48 hrs notice)';
    if (req.note && req.note.trim()) s += '. ' + req.note.trim();
    return s;
  }

  window.BBCustom = {
    KEY: KEY, LEAD_DAYS: LEAD_DAYS, FREE_DELIVERY: FREE_DELIVERY,
    IMG: IMG, PACK: PACK, RETAIL: RETAIL, shots: shots, lineImg: lineImg, CATS: CATS, SIZES: SIZES, ADDINS: ADDINS,
    catalog: catalog, sizePrice: sizePrice, money: money,
    minDate: minDate, prettyDate: prettyDate, dateOk: dateOk,
    save: save, read: read, clear: clear, notesLine: notesLine,
  };
})();
