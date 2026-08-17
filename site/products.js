/* Bliss & Butter — shared product detail data.
 * Full per-category product records (description, ingredients, variants,
 * rating, reviews) plus category + menu meta. Used by the mobile pages so
 * they share one source of truth with the desktop catalog. Read-only. */
(function () {
  var PRODUCTS = {
    cookies: [
      { slug: 'choc-chip', name: 'CHOCOLATE CHIP', price: '$47.25', rating: 4.8, reviews: 1240, tags: ['best'], desc: 'Our signature cookie: crisp golden edges, a soft chewy center, and pools of melted dark chocolate in every bite. Baked fresh each morning.', ing: ['Stone-ground flour', 'European butter', 'Dark chocolate chunks', 'Brown sugar', 'Free-range eggs', 'Madagascar vanilla', 'Sea salt'] },
      { slug: 'oatmeal', name: 'OATMEAL RAISIN', price: '$44.50', rating: 4.5, reviews: 612, tags: [], desc: 'Hearty rolled oats and plump raisins folded into a warm cinnamon dough. Wholesome, comforting, and never too sweet.', ing: ['Rolled oats', 'Stone-ground flour', 'Sultana raisins', 'Butter', 'Cinnamon', 'Brown sugar', 'Free-range eggs'] },
      { slug: 'oatmeal-choc-chip', name: 'OATMEAL CHOCOLATE CHIP', price: '$46.50', rating: 4.7, reviews: 540, tags: ['new'], desc: 'Hearty rolled oats and pools of dark chocolate in a soft, chewy cookie — the best of both classics in every bite. Wholesome meets indulgent.', ing: ['Rolled oats', 'Stone-ground flour', 'Dark chocolate chips', 'European butter', 'Brown sugar', 'Free-range eggs', 'Sea salt'] },
      { slug: 'double-choc', name: 'DOUBLE CHOCOLATE', price: '$50.20', rating: 4.9, reviews: 1580, tags: ['best'], desc: 'For the serious chocolate lover — a deep cocoa dough loaded with both dark and milk chocolate chunks. Fudgy all the way through.', ing: ['Stone-ground flour', 'Dutch cocoa', 'Dark chocolate', 'Milk chocolate', 'Butter', 'Brown sugar', 'Free-range eggs'] },
      { slug: 'peanut-butter', name: 'PEANUT BUTTER', price: '$46.00', rating: 4.6, reviews: 430, tags: ['new'], desc: 'Rich roasted peanut butter cookies with that classic criss-cross top. Nutty, melt-in-your-mouth, and irresistibly soft.', ing: ['Roasted peanut butter', 'Stone-ground flour', 'Butter', 'Brown sugar', 'Free-range eggs', 'Sea salt'] },
      { slug: 'pb-choc-chip', name: 'PEANUT BUTTER CHOCOLATE CHIP', price: '$48.00', rating: 4.8, reviews: 720, tags: ['new'], desc: 'Rich peanut butter dough loaded with melty dark chocolate chips and finished with flaky sea salt. Sweet, salty, gooey, and completely irresistible.', ing: ['Roasted peanut butter', 'Stone-ground flour', 'Dark chocolate chips', 'European butter', 'Brown sugar', 'Free-range eggs', 'Flaky sea salt'] },
      { slug: 'snickerdoodle', name: 'SNICKERDOODLE', price: '$45.75', rating: 4.4, reviews: 388, tags: ['vegan'], desc: 'Pillowy soft cookies rolled in cinnamon sugar with a gentle tang. A plant-based take on the old-fashioned favorite.', ing: ['Stone-ground flour', 'Plant butter', 'Cane sugar', 'Cinnamon', 'Cream of tartar', 'Aquafaba'] },
    ],
    bread: [
      { slug: 'sourdough', name: 'SOURDOUGH', price: '$12.50', rating: 4.9, reviews: 2104, tags: ['best', 'vegan'], desc: 'A 36-hour naturally leavened loaf with a blistered, crackling crust and an open, custardy crumb. Tangy, deep, and honest.', ing: ['Stone-milled flour', 'Water', 'Sea salt', 'Wild sourdough starter'], variants: [
        { key: 'boule', label: 'Country Boule', sub: 'Classic round \u00b7 800g', price: '$12.50' },
        { key: 'batard', label: 'B\u00e2tard', sub: 'Oval, extra crust \u00b7 750g', price: '$12.50' },
        { key: 'baguette', label: 'Sourdough Baguette', sub: 'Long & crackly \u00b7 400g', price: '$8.25' },
        { key: 'rolls', label: 'Seeded Rolls (6)', sub: 'Sesame & flax \u00b7 6-pack', price: '$11.00' },
        { key: 'miche', label: 'Rustic Miche', sub: 'Large sharing loaf \u00b7 1.4kg', price: '$18.00' },
      ] },
      { slug: 'baguette', name: 'BAGUETTE', price: '$8.25', rating: 4.7, reviews: 980, tags: ['best', 'vegan'], desc: 'Thin, crackling crust giving way to a light, airy interior. Baked twice daily and best enjoyed within the hour.', ing: ['Stone-milled flour', 'Water', 'Sea salt', 'Levain'] },
      { slug: 'rye', name: 'RYE LOAF', price: '$11.00', rating: 4.5, reviews: 340, tags: ['vegan'], desc: 'Dense, dark, and earthy with notes of caraway and molasses. Slow-fermented for a flavor that deepens by the day.', ing: ['Whole rye flour', 'Stone-milled wheat', 'Caraway seeds', 'Molasses', 'Sea salt', 'Levain'] },
      { slug: 'ciabatta', name: 'CIABATTA', price: '$9.75', rating: 4.6, reviews: 520, tags: ['vegan'], desc: 'A rustic Italian loaf with a floury crust and big, irregular holes. Made with a wet dough and a long, gentle rise.', ing: ['Stone-milled flour', 'Water', 'Extra-virgin olive oil', 'Sea salt', 'Biga'] },
      { slug: 'brioche', name: 'BRIOCHE', price: '$13.20', rating: 4.8, reviews: 760, tags: ['new'], desc: 'A tender, golden, butter-enriched loaf with a feather-soft crumb and a delicate sweetness. Pure indulgence.', ing: ['Stone-milled flour', 'European butter', 'Free-range eggs', 'Whole milk', 'Cane sugar', 'Sea salt'] },
    ],
    pies: [
      { slug: 'apple', name: 'APPLE PIE', price: '$47.25', rating: 4.8, reviews: 1320, tags: ['best'], desc: 'Hand-folded butter crust packed with spiced orchard apples that hold their bite. Baked until golden and bubbling.', ing: ['Stone-ground flour', 'European butter', 'Orchard apples', 'Cinnamon', 'Nutmeg', 'Cane sugar', 'Lemon'], variants: [
        { key: 'whole', label: 'Whole Pie', sub: '9-inch \u00b7 serves 8', price: '$47.25', img: 'uploads/apple-pie-cutout.png' },
        { key: 'mini', label: 'Mini Pies (4)', sub: 'Personal size \u00b7 4-pack', price: '$22.00', img: 'uploads/mini-apple-pie-cutout.png' },
      ] },
      { slug: 'cherry', name: 'CHERRY PIE', price: '$48.50', rating: 4.7, reviews: 870, tags: ['best'], desc: 'Tart Montmorency cherries under a flaky lattice top. Bright, jammy, and bursting with real fruit.', ing: ['Stone-ground flour', 'Butter', 'Montmorency cherries', 'Cane sugar', 'Vanilla', 'Lemon'] },
      { slug: 'pumpkin', name: 'PUMPKIN PIE', price: '$46.00', rating: 4.6, reviews: 540, tags: [], desc: 'Silky spiced pumpkin custard in a tender crust. Warm with cinnamon, ginger, and clove — the taste of autumn.', ing: ['Sugar pumpkin', 'Stone-ground flour', 'Butter', 'Free-range eggs', 'Cream', 'Cinnamon', 'Ginger', 'Clove'] },
      { slug: 'pecan', name: 'PECAN PIE', price: '$52.20', rating: 4.9, reviews: 1010, tags: ['best'], desc: 'Toasted pecans suspended in a glossy, just-set caramel filling. Rich, buttery, and deeply satisfying.', ing: ['Toasted pecans', 'Stone-ground flour', 'Butter', 'Maple syrup', 'Brown sugar', 'Free-range eggs', 'Vanilla'] },
      { slug: 'key-lime', name: 'KEY LIME PIE', price: '$49.00', rating: 4.5, reviews: 460, tags: ['new'], desc: 'Cool, zesty key lime custard on a buttery graham base, topped with billowy cream. Tart, sweet, and refreshing.', ing: ['Key lime juice', 'Graham crust', 'Condensed milk', 'Free-range egg yolks', 'Cream', 'Lime zest'] },
    ],
    cakes: [
      { slug: 'plain', name: 'PLAIN CAKE', price: '$50.20', rating: 4.4, reviews: 290, tags: [], desc: 'A classic vanilla butter cake — moist, tender, and lightly sweet. The perfect canvas for any celebration.', ing: ['Stone-ground flour', 'European butter', 'Free-range eggs', 'Cane sugar', 'Madagascar vanilla', 'Whole milk'] },
      { slug: 'red-velvet', name: 'RED VELVET', price: '$58.00', rating: 4.8, reviews: 1140, tags: ['best'], desc: 'Velvety cocoa-kissed layers with a subtle tang, wrapped in silky cream-cheese frosting. A showstopper.', ing: ['Stone-ground flour', 'Dutch cocoa', 'Buttermilk', 'Cream cheese', 'Butter', 'Free-range eggs', 'Cane sugar'] },
      { slug: 'carrot', name: 'CARROT CAKE', price: '$54.50', rating: 4.7, reviews: 680, tags: [], desc: 'Spiced layers studded with fresh carrot and toasted walnut, finished with cream-cheese frosting. Moist and homey.', ing: ['Stone-ground flour', 'Fresh carrot', 'Walnuts', 'Cream cheese', 'Cinnamon', 'Free-range eggs', 'Cane sugar'] },
      { slug: 'chocolate', name: 'CHOCOLATE CAKE', price: '$56.25', rating: 4.9, reviews: 1620, tags: ['best'], desc: 'Deep, dark chocolate sponge layered with glossy ganache. Decadent, fudgy, and impossibly rich.', ing: ['Stone-ground flour', 'Dutch cocoa', 'Dark chocolate', 'Butter', 'Free-range eggs', 'Cane sugar', 'Cream'] },
      { slug: 'lemon', name: 'LEMON DRIZZLE', price: '$52.75', rating: 4.6, reviews: 500, tags: ['new'], desc: 'Zesty lemon sponge soaked in a tangy citrus syrup and finished with a sugar crackle. Bright and refreshing.', ing: ['Stone-ground flour', 'Butter', 'Fresh lemon', 'Free-range eggs', 'Cane sugar', 'Lemon zest'], variants: [
        { key: 'round', label: 'Round Cake', sub: '8-inch \u00b7 serves 10', price: '$52.75', img: 'uploads/lemon-cake-cutout.png' },
        { key: 'loaf', label: 'Loaf', sub: 'Sharing loaf \u00b7 serves 6', price: '$26.00', img: 'uploads/lemon-loaf-cutout.png' },
      ] },
    ],
    pastries: [
      { slug: 'croissant', name: 'BUTTER CROISSANT', price: '$4.50', rating: 4.9, reviews: 1880, tags: ['best'], desc: 'Hand-laminated with 27 layers of European butter, baked to a deep amber. Shatteringly crisp outside, soft and honeycombed within.', ing: ['Stone-milled flour', 'European butter', 'Whole milk', 'Free-range eggs', 'Cane sugar', 'Sea salt', 'Levain'] },
      { slug: 'pain-au-chocolat', name: 'PAIN AU CHOCOLAT', price: '$5.25', rating: 4.8, reviews: 1320, tags: ['best'], desc: 'The classic croissant dough wrapped around two batons of dark chocolate, baked until the layers crackle and the chocolate melts.', ing: ['Stone-milled flour', 'European butter', 'Dark chocolate batons', 'Whole milk', 'Free-range eggs', 'Cane sugar', 'Sea salt'] },
      { slug: 'almond-croissant', name: 'ALMOND CROISSANT', price: '$5.75', rating: 4.7, reviews: 740, tags: [], desc: 'A day-two croissant soaked in vanilla syrup, filled with frangipane, and crowned with toasted almonds and powdered sugar.', ing: ['Stone-milled flour', 'European butter', 'Almond frangipane', 'Toasted almonds', 'Free-range eggs', 'Vanilla', 'Powdered sugar'] },
      { slug: 'danish', name: 'BERRY DANISH', price: '$4.95', rating: 4.6, reviews: 520, tags: ['new'], desc: 'Flaky pinwheel pastry cradling vanilla pastry cream and a spoonful of seasonal berries. Glazed to a glossy finish.', ing: ['Stone-milled flour', 'Butter', 'Vanilla pastry cream', 'Seasonal berries', 'Free-range eggs', 'Cane sugar', 'Apricot glaze'] },
      { slug: 'cinnamon-roll', name: 'CINNAMON ROLL', price: '$4.75', rating: 4.8, reviews: 960, tags: ['vegan'], desc: 'A soft enriched coil layered with cinnamon sugar and finished with a plant-based glaze. Warm, gooey, and generous.', ing: ['Stone-milled flour', 'Plant butter', 'Cinnamon', 'Brown sugar', 'Oat milk', 'Cane sugar', 'Vanilla glaze'] },
    ],
  };
  // Per-category display meta (hero, colors, pills, counts for chips)
  var CAT_META = {
    bread:    { label: 'BREAD',    title: 'Bread',    tagline: 'Artisan loaves baked from scratch with pure love',  pills: ['WHOLESOME', 'FRESH'],   count: 23, chipBg: '#F4C9A6', chipFg: '#8A4B2A', pillBg: '#8A4B2A' },
    cookies:  { label: 'COOKIES',  title: 'Cookies',  tagline: 'Crunchy, chewy cookies handcrafted with pure love',  pills: ['CRUNCHY', 'TASTY'],    count: 32, chipBg: '#DED0CB', chipFg: '#6B4A45', pillBg: '#4A2F2B' },
    pastries: { label: 'PASTRIES', title: 'Pastries', tagline: 'Flaky, hand-laminated pastries made with pure love', pills: ['BUTTERY', 'FLAKY'],    count: 27, chipBg: '#E7E2DD', chipFg: '#6B6259', pillBg: '#4A4039' },
    pies:     { label: 'PIES',     title: 'Pies',     tagline: 'Buttery, fruit-filled pies baked with pure love',    pills: ['FLAKY', 'SEASONAL'],   count: 18, chipBg: '#E0D4F0', chipFg: '#5A3E8C', pillBg: '#3A2A6B' },
    cakes:    { label: 'CAKES',    title: 'Cakes',    tagline: 'Light, celebratory cakes made with pure love',       pills: ['FLUFFY', 'SWEET'],     count: 27, chipBg: '#BFE0E5', chipFg: '#2C6E78', pillBg: '#1F6470' },
  };
  window.BBProducts = PRODUCTS;
  window.BBCatMeta = CAT_META;
  window.BBCatOrder = ['bread', 'cookies', 'pastries', 'pies', 'cakes'];
})();
