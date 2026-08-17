/* Bliss & Butter — product image registry.
 * Maps a product (category/slug) or a category-level cutout (cat/<category>)
 * to a baked-in default image. Slots bind this via `src`, so a user-dropped
 * image still overrides it and clearing the drop reveals this default again.
 * Add one line per product image as they come in. */
window.BB_IMAGES = {
  // Chocolate chip cookie (transparent cutout)
  'cookies/choc-chip': 'uploads/choc-chip-cutout.png',
  // Oatmeal raisin cookie (transparent cutout)
  'cookies/oatmeal': 'uploads/oatmeal-raisin-cutout.png',
  // Double chocolate cookie (styled cutout on parchment)
  'cookies/double-choc': 'uploads/double-choc-cutout.png',
  // Oatmeal chocolate chip cookie (transparent cutout) — NEW product
  'cookies/oatmeal-choc-chip': 'uploads/oatmeal-choc-chip-cutout.png',
  // Peanut butter chocolate chip cookie (transparent cutout) — NEW product
  'cookies/pb-choc-chip': 'uploads/pb-choc-chip-cutout.png',
  // Classic peanut butter cookie, criss-cross top (transparent cutout)
  'cookies/peanut-butter': 'uploads/peanut-butter-cutout.png',
  // Snickerdoodle, cinnamon-sugar crinkle top (transparent cutout)
  'cookies/snickerdoodle': 'uploads/snickerdoodle-cutout.png',
  // Sourdough / bread selection (transparent cutout)
  'bread/sourdough': 'uploads/sourdough-cutout.png',
  // Bread category-level hero basket (transparent, 4:5 marquee)
  'cat/bread': 'uploads/Breads 2.png',
  // Rye loaf (transparent cutout)
  'bread/rye': 'uploads/rye-cutout.png',
  // Ciabatta (transparent cutout)
  'bread/ciabatta': 'uploads/ciabatta-cutout.png',
  // Baguette (transparent cutout)
  'bread/baguette': 'uploads/baguette-cutout.png',
  // Brioche (transparent cutout)
  'bread/brioche': 'uploads/brioche-cutout.png',
  // Butter croissant — flagship (transparent cutout)
  'pastries/croissant': 'uploads/croissant-cutout.png',
  // Pain au chocolat (transparent cutout)
  'pastries/pain-au-chocolat': 'uploads/pain-choc-cutout.png',
  // Almond croissant (transparent cutout)
  'pastries/almond-croissant': 'uploads/almond-croissant-cutout.png',
  // Cinnamon roll (transparent cutout)
  'pastries/cinnamon-roll': 'uploads/cinnamon-roll-cutout.png',
  // Berry / blueberry danish (transparent cutout)
  'pastries/danish': 'uploads/danish-cutout.png',
  // Pastry category-level hero basket (transparent, 4:5 marquee)
  'cat/pastries': 'uploads/Pastries.png',
  // Pies
  'pies/apple': 'uploads/apple-pie-cutout.png',
  'pies/cherry': 'uploads/cherry-pie-cutout.png',
  'pies/pumpkin': 'uploads/pumpkin-pie-cutout.png',
  // Pie category-level hero basket (transparent, 4:5 marquee)
  'cat/pies': 'uploads/Pies.png',
  'pies/pecan': 'uploads/pecan-pie-cutout.png',
  'pies/key-lime': 'uploads/keylime-pie-cutout.png',
  // Cakes
  'cakes/plain': 'uploads/vanilla-cake-cutout.png',
  'cakes/carrot': 'uploads/carrot-cake-cutout.png',
  'cakes/red-velvet': 'uploads/red-velvet-cutout.png',
  'cakes/chocolate': 'uploads/chocolate-cake-cutout.png',
  'cakes/lemon': 'uploads/lemon-cake-cutout.png',
  // Cake category-level hero basket (transparent, 4:5 marquee)
  'cat/cakes': 'uploads/Cakes.png',
  // Cookie category-level hero basket (transparent, 4:5 marquee)
  'cat/cookies': 'uploads/Cookies.png',

  /* Secondary category imagery — full-frame PHOTOS (not cutouts) for
   * object-fit:cover frames on Product.dc.html. `craft/*` = a baker at work,
   * `spread/*` = the finished goods. Never swap a *-cutout in here; cutouts
   * carry transparency and read as broken in a cover frame. */
  'craft/cookies': 'uploads/craft-cookies.jpg',
  'craft/bread': 'uploads/craft-bread.jpg',
  'craft/pies': 'uploads/craft-pies.jpg',
  'craft/cakes': 'uploads/craft-cakes.jpg',
  'craft/pastries': 'uploads/craft-pastries.jpg',
  'spread/cookies': 'uploads/spread-cookies.jpg',
  'spread/bread': 'uploads/spread-bread.jpg',
  'spread/pies': 'uploads/spread-pies.jpg',
  'spread/cakes': 'uploads/spread-cakes.jpg',
  'spread/pastries': 'uploads/spread-pastries.jpg',

  /* Testimonial avatars, keyed by reviewer name. */
  'avatar/Mariah Lewis': 'uploads/testi-mariah.jpg',
  'avatar/Devon Carter': 'uploads/testi-devon.jpg',
  'avatar/Priya Anand': 'uploads/testi-priya.jpg',
};
