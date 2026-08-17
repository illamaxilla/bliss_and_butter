/* Bliss & Butter — <bb-search> global type-ahead search.
 * Drop <bb-search></bb-search> in any nav and include this script + catalog.js.
 * Renders a round trigger button; opens a full-screen type-ahead overlay.
 * Reads window.BBCatalog / window.BBCatalogSearch. Keyboard: "/" or Cmd/Ctrl-K
 * to open, arrows to move, Enter to open a result, Esc to close. */
(function () {
  if (customElements.get('bb-search')) return;

  var STAR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#F5B922"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 3.6 1.6-6.7L2.2 9.5l6.9-.6z"/></svg>';
  var OCCASIONS = [
    { key: 'best', label: 'Best sellers', test: function (p) { return p.tags.indexOf('best') >= 0; } },
    { key: 'birthday', label: 'Birthday', test: function (p) { return p.occasions.indexOf('birthday') >= 0; } },
    { key: 'wedding', label: 'Wedding', test: function (p) { return p.occasions.indexOf('wedding') >= 0; } },
    { key: 'everyday', label: 'Everyday', test: function (p) { return p.occasions.indexOf('everyday') >= 0; } },
    { key: 'breakfast', label: 'Breakfast', test: function (p) { return p.occasions.indexOf('breakfast') >= 0; } },
    { key: 'vegan', label: 'Vegan', test: function (p) { return p.tags.indexOf('vegan') >= 0; } },
  ];

  function catalog() { return (window.BBCatalog || []); }

  class BBSearch extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      this.attachShadow({ mode: 'open' });
      this.query = '';
      this.results = [];
      this.active = 0;
      this.occasion = null;
      this.shadowRoot.innerHTML = this._html();
      this._trigger = this.shadowRoot.getElementById('trigger');
      this._overlay = this.shadowRoot.getElementById('overlay');
      this._input = this.shadowRoot.getElementById('input');
      this._resultsEl = this.shadowRoot.getElementById('results');
      this._trigger.addEventListener('click', () => this.open());
      this._overlay.addEventListener('click', (e) => { if (e.target === this._overlay) this.close(); });
      this._input.addEventListener('input', () => { this.query = this._input.value; this.occasion = null; this.active = 0; this._render(); });
      this._input.addEventListener('keydown', (e) => this._onKey(e));
      this._resultsEl.addEventListener('click', (e) => {
        var row = e.target.closest('[data-href]');
        if (row) window.location.href = row.getAttribute('data-href');
        var chip = e.target.closest('[data-occ]');
        if (chip) { this.occasion = chip.getAttribute('data-occ'); this.query = ''; this._input.value = ''; this.active = 0; this._render(); }
      });
      this._globalKey = (e) => {
        if ((e.key === '/' && !/input|textarea/i.test((document.activeElement || {}).tagName)) ||
            ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
          e.preventDefault(); this.open();
        }
      };
      document.addEventListener('keydown', this._globalKey);
    }
    disconnectedCallback() { document.removeEventListener('keydown', this._globalKey); }

    open() {
      this._overlay.style.display = 'flex';
      requestAnimationFrame(() => { this._overlay.style.opacity = '1'; this._panel().style.transform = 'translateY(0)'; });
      this.query = ''; this._input.value = ''; this.occasion = null; this.active = 0;
      this._render();
      setTimeout(() => this._input.focus(), 40);
      document.documentElement.style.overflow = 'hidden';
    }
    close() {
      this._overlay.style.opacity = '0'; this._panel().style.transform = 'translateY(-14px)';
      setTimeout(() => { this._overlay.style.display = 'none'; }, 200);
      document.documentElement.style.overflow = '';
    }
    _panel() { return this.shadowRoot.getElementById('panel'); }

    _onKey(e) {
      if (e.key === 'Escape') { this.close(); return; }
      var n = this.results.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (n) { this.active = (this.active + 1) % n; this._paint(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) { this.active = (this.active - 1 + n) % n; this._paint(); } }
      else if (e.key === 'Enter') { var r = this.results[this.active]; if (r) window.location.href = r.href; }
    }

    _compute() {
      if (this.query.trim()) { this.results = (window.BBCatalogSearch ? window.BBCatalogSearch(this.query) : []); return; }
      if (this.occasion) {
        var occ = OCCASIONS.filter((o) => o.key === this.occasion)[0];
        this.results = occ ? catalog().filter(occ.test).sort((a, b) => b.rating - a.rating) : [];
        return;
      }
      this.results = catalog().slice().sort((a, b) => b.rating - a.rating).slice(0, 6); // popular
    }

    _render() { this._compute(); this._paint(); }

    _paint() {
      var q = this.query.trim();
      var heading = q ? (this.results.length + ' result' + (this.results.length === 1 ? '' : 's') + ' for \u201C' + q + '\u201D')
        : this.occasion ? (this.occasion.charAt(0).toUpperCase() + this.occasion.slice(1)).replace('Best', 'Best sellers')
        : 'Popular right now';
      var chips = OCCASIONS.map((o) =>
        '<button data-occ="' + o.key + '" class="chip' + (this.occasion === o.key ? ' chipOn' : '') + '">' + o.label + '</button>').join('');
      var body;
      if (q && this.results.length === 0) {
        body = '<div class="empty"><div class="emptyIcon">\u2315</div><div class="emptyTitle">No bakes match \u201C' + this._esc(q) + '\u201D</div>'
          + '<div class="emptySub">Try a category like \u201Ccookies\u201D or \u201Cpie\u201D, or browse below.</div></div>';
      } else {
        body = this.results.map((p, i) => this._row(p, i)).join('');
      }
      this._resultsEl.innerHTML =
        '<div class="chips">' + chips + '</div>' +
        '<div class="hd">' + heading + '</div>' +
        '<div class="rows">' + body + '</div>';
    }

    _row(p, i) {
      var img = p.img
        ? '<span class="thumb" style="background-image:url(\'' + p.img + '\');"></span>'
        : '<span class="thumb thumbEmpty">' + p.name.charAt(0) + '</span>';
      var tag = p.tags.indexOf('best') >= 0 ? '<span class="pt ptBest">BEST</span>'
        : p.tags.indexOf('new') >= 0 ? '<span class="pt ptNew">NEW</span>'
        : p.tags.indexOf('vegan') >= 0 ? '<span class="pt ptVegan">VEGAN</span>' : '';
      return '<a class="row' + (i === this.active ? ' rowOn' : '') + '" data-href="' + p.href + '">' +
        img +
        '<span class="meta"><span class="nm">' + p.name + ' ' + tag + '</span>' +
        '<span class="sub">' + p.catLabel + ' &middot; ' + STAR + ' ' + p.rating.toFixed(1) + '</span></span>' +
        '<span class="price">' + p.priceStr + '</span>' +
        '<span class="go"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D1B14" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></span></a>';
    }
    _esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    _html() {
      return '<style>' +
        ':host{display:inline-flex;}' +
        '#trigger{width:50px;height:50px;border-radius:50%;background:#fff;border:none;box-shadow:0 4px 14px rgba(45,27,20,.12);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .12s;}' +
        '#trigger:hover{transform:translateY(-2px);}#trigger:active{transform:translateY(0);}' +
        '#overlay{display:none;position:fixed;inset:0;z-index:3000;background:rgba(45,27,20,.55);opacity:0;transition:opacity .2s ease;padding:80px 20px;justify-content:center;align-items:flex-start;}' +
        '#panel{width:100%;max-width:680px;background:#FFFCF8;border:2.5px solid #2D1B14;border-radius:30px;box-shadow:0 30px 70px rgba(45,27,20,.35);overflow:hidden;transform:translateY(-14px);transition:transform .22s cubic-bezier(.2,1,.3,1);font-family:"Nunito",sans-serif;}' +
        '.bar{display:flex;align-items:center;gap:14px;padding:20px 22px;border-bottom:1.6px solid #ECE2DA;}' +
        '#input{flex:1;font-family:inherit;font-size:21px;font-weight:700;color:#2D1B14;border:none;outline:none;background:transparent;}' +
        '#input::placeholder{color:#B7A99C;}' +
        '.kbd{font-family:"Lilita One","Arial Black",sans-serif;font-size:12px;letter-spacing:.5px;color:#9A8A80;background:#F2E9E4;border-radius:8px;padding:5px 9px;}' +
        '#results{max-height:min(62vh,560px);overflow-y:auto;padding:16px 16px 20px;}' +
        '.chips{display:flex;flex-wrap:wrap;gap:8px;padding:4px 6px 6px;}' +
        '.chip{font-family:"Lilita One","Arial Black",sans-serif;font-size:13px;letter-spacing:.4px;color:#2D1B14;background:#FFFCF8;border:2px solid #E4D8CF;border-radius:30px;padding:8px 15px;cursor:pointer;transition:transform .1s;}' +
        '.chip:hover{transform:translateY(-1px);}.chipOn{background:#FCD414;border-color:#2D1B14;box-shadow:2px 3px 0 #2D1B14;}' +
        '.hd{font-family:"Lilita One","Arial Black",sans-serif;font-size:13px;letter-spacing:.7px;color:#9A8A80;text-transform:uppercase;padding:16px 8px 8px;}' +
        '.rows{display:flex;flex-direction:column;gap:4px;}' +
        '.row{display:flex;align-items:center;gap:14px;padding:11px 12px;border-radius:18px;text-decoration:none;cursor:pointer;transition:background .1s;}' +
        '.row:hover,.rowOn{background:#F2E9E4;}' +
        '.thumb{width:52px;height:52px;border-radius:14px;background:#F2E9E4;background-size:contain;background-repeat:no-repeat;background-position:center;flex-shrink:0;display:flex;align-items:center;justify-content:center;}' +
        '.thumbEmpty{font-family:"Lilita One","Arial Black",sans-serif;font-size:22px;color:#C3B5A8;}' +
        '.meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}' +
        '.nm{font-family:"Lilita One","Arial Black",sans-serif;font-size:17px;letter-spacing:.2px;color:#2D1B14;line-height:1.1;}' +
        '.sub{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:700;color:#9A8A80;}' +
        '.price{font-family:"Lilita One","Arial Black",sans-serif;font-size:18px;color:#2D1B14;flex-shrink:0;}' +
        '.go{flex-shrink:0;opacity:.5;display:flex;}' +
        '.pt{font-family:"Lilita One","Arial Black",sans-serif;font-size:10px;letter-spacing:.4px;border-radius:20px;padding:2px 7px;vertical-align:middle;margin-left:4px;}' +
        '.ptBest{color:#fff;background:#EF5F2B;}.ptNew{color:#2D1B14;background:#FCD414;}.ptVegan{color:#fff;background:#2E7D46;}' +
        '.empty{text-align:center;padding:44px 20px 40px;}' +
        '.emptyIcon{font-size:44px;color:#C9BBAE;}' +
        '.emptyTitle{font-family:"Lilita One","Arial Black",sans-serif;font-size:22px;color:#2D1B14;margin-top:10px;}' +
        '.emptySub{font-size:15px;font-weight:600;color:#9A8A80;margin-top:8px;}' +
        '</style>' +
        '<button id="trigger" aria-label="Search products">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D1B14" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '</button>' +
        '<div id="overlay"><div id="panel">' +
          '<div class="bar">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D1B14" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
            '<input id="input" placeholder="Search cookies, cakes, sourdough\u2026" autocomplete="off" spellcheck="false">' +
            '<span class="kbd">ESC</span>' +
          '</div>' +
          '<div id="results"></div>' +
        '</div></div>';
    }
  }
  customElements.define('bb-search', BBSearch);
})();
