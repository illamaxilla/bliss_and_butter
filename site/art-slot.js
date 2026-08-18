/* Bliss & Butter — art slots for the live tree.
 *
 * The prerendered markup carries real <img> tags: tools/prerender.mjs flattens
 * every filled slot at build time, so the photography is in the served bytes and
 * shows with JavaScript disabled. This file exists only for the hydrated tree,
 * where the component renders <image-slot> elements itself.
 *
 * It is a deliberate 40-line replacement for the authoring component
 * (image-slot.js), which also carried drag-and-drop, IndexedDB persistence and
 * mutation observers — machinery a visitor never uses, and which froze the page
 * when it ran across two mounted trees.
 */
(function () {
  if (window.customElements && customElements.get('image-slot')) return;

  var RADIUS = { rect: '0', rounded: null, circle: '50%', pill: '999px' };

  function radiusFor(el) {
    var shape = el.getAttribute('shape') || 'rect';
    if (shape === 'rounded') return (el.getAttribute('radius') || '16') + 'px';
    return RADIUS[shape] != null ? RADIUS[shape] : '0';
  }

  var ArtSlot = function () {};
  ArtSlot = class extends HTMLElement {
    static get observedAttributes() { return ['src', 'fit', 'shape', 'radius']; }

    connectedCallback() {
      if (!this.shadowRoot) {
        var root = this.attachShadow({ mode: 'open' });
        var style = document.createElement('style');
        style.textContent = ':host{display:block;overflow:hidden;}' +
          'img{display:block;width:100%;height:100%;}' +
          ':host(:not([src])){background:#F6EAE2;}';
        this.img = document.createElement('img');
        this.img.alt = '';
        this.img.decoding = 'async';
        // No loading="lazy" here. This tree is built while its container is
        // still display:none, so a lazy image is deferred and never
        // re-evaluated when the container is un-hidden — the photo would never
        // arrive. The prerendered tree keeps lazy loading; this one mounts only
        // after hydration, so eager is the correct choice.
        this.img.loading = 'eager';
        root.appendChild(style);
        root.appendChild(this.img);
      }
      this.sync();
    }

    attributeChangedCallback() { if (this.shadowRoot) this.sync(); }

    sync() {
      var src = this.getAttribute('src');
      this.img.style.display = src ? 'block' : 'none';
      if (src && this.img.getAttribute('src') !== src) this.img.setAttribute('src', src);
      this.img.style.objectFit = this.getAttribute('fit') === 'cover' ? 'cover' : 'contain';
      this.style.borderRadius = radiusFor(this);
    }
  };

  customElements.define('image-slot', ArtSlot);
})();
