/* Bliss & Butter — shared product catalog (search / discovery index).
 * Lightweight index of every product across categories. Powers the global
 * type-ahead search and occasion shortcuts. Detailed product copy still lives
 * in Product.dc.html; this is just the searchable surface. */
(function () {
  var CAT_LABEL = { bread: 'Bread', cookies: 'Cookies', pastries: 'Pastries', pies: 'Pies', cakes: 'Cakes' };
  // occasions applied per category, merged with per-tag flags below
  var CAT_OCCASION = {
    cakes: ['birthday', 'wedding', 'celebration'],
    pies: ['celebration', 'everyday'],
    cookies: ['everyday', 'birthday'],
    bread: ['everyday'],
    pastries: ['everyday', 'breakfast'],
  };
  // [slug, NAME, price, rating, tags]
  var DATA = {
    cookies: [
      ['choc-chip', 'CHOCOLATE CHIP', 47.25, 4.8, ['best']],
      ['oatmeal', 'OATMEAL RAISIN', 44.50, 4.5, []],
      ['oatmeal-choc-chip', 'OATMEAL CHOCOLATE CHIP', 46.50, 4.7, ['new']],
      ['double-choc', 'DOUBLE CHOCOLATE', 50.20, 4.9, ['best']],
      ['peanut-butter', 'PEANUT BUTTER', 46.00, 4.6, ['new']],
      ['pb-choc-chip', 'PEANUT BUTTER CHOCOLATE CHIP', 48.00, 4.8, ['new']],
      ['snickerdoodle', 'SNICKERDOODLE', 45.75, 4.4, ['vegan']],
    ],
    bread: [
      ['sourdough', 'SOURDOUGH', 12.50, 4.9, ['best', 'vegan']],
      ['baguette', 'BAGUETTE', 8.25, 4.7, ['best', 'vegan']],
      ['rye', 'RYE LOAF', 11.00, 4.5, ['vegan']],
      ['ciabatta', 'CIABATTA', 9.75, 4.6, ['vegan']],
      ['brioche', 'BRIOCHE', 13.20, 4.8, ['new']],
    ],
    pies: [
      ['apple', 'APPLE PIE', 47.25, 4.8, ['best']],
      ['cherry', 'CHERRY PIE', 48.50, 4.7, ['best']],
      ['pumpkin', 'PUMPKIN PIE', 46.00, 4.6, []],
      ['pecan', 'PECAN PIE', 52.20, 4.9, ['best']],
      ['key-lime', 'KEY LIME PIE', 49.00, 4.5, ['new']],
    ],
    cakes: [
      ['plain', 'PLAIN CAKE', 50.20, 4.4, []],
      ['red-velvet', 'RED VELVET', 58.00, 4.8, ['best']],
      ['carrot', 'CARROT CAKE', 54.50, 4.7, []],
      ['chocolate', 'CHOCOLATE CAKE', 56.25, 4.9, ['best']],
      ['lemon', 'LEMON DRIZZLE', 52.75, 4.6, ['new']],
    ],
    pastries: [
      ['croissant', 'BUTTER CROISSANT', 4.50, 4.9, ['best']],
      ['pain-au-chocolat', 'PAIN AU CHOCOLAT', 5.25, 4.8, ['best']],
      ['almond-croissant', 'ALMOND CROISSANT', 5.75, 4.7, []],
      ['danish', 'BERRY DANISH', 4.95, 4.6, ['new']],
      ['cinnamon-roll', 'CINNAMON ROLL', 4.75, 4.8, ['vegan']],
    ],
  };
  var IMG = (typeof window !== 'undefined' && window.BB_IMAGES) || {};
  var list = [];
  Object.keys(DATA).forEach(function (cat) {
    DATA[cat].forEach(function (r) {
      var tags = r[4] || [];
      var occ = (CAT_OCCASION[cat] || []).slice();
      if (tags.indexOf('vegan') >= 0) occ.push('vegan');
      list.push({
        cat: cat, catLabel: CAT_LABEL[cat], slug: r[0], name: r[1],
        price: r[2], priceStr: '$' + r[2].toFixed(2), rating: r[3], tags: tags, occasions: occ,
        img: IMG[cat + '/' + r[0]] || IMG['cat/' + cat] || '',
        href: 'Product.dc.html?category=' + cat + '&product=' + r[0],
      });
    });
  });
  window.BBCatalog = list;
  window.BBCatalogSearch = function (q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    return list.map(function (p) {
      var name = p.name.toLowerCase();
      var score = 0;
      if (name === q) score = 100;
      else if (name.indexOf(q) === 0) score = 60;
      else if (name.indexOf(' ' + q) >= 0) score = 40;
      else if (name.indexOf(q) >= 0) score = 25;
      else if (p.cat.indexOf(q) >= 0 || p.catLabel.toLowerCase().indexOf(q) >= 0) score = 12;
      else if (p.occasions.join(' ').indexOf(q) >= 0) score = 8;
      return { p: p, score: score };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score || b.p.rating - a.p.rating; })
      .map(function (x) { return x.p; });
  };
})();
