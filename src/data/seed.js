/**
 * Seed data.
 *
 * Menu items, names, descriptions and prices are transcribed verbatim from
 * ZenG_Kolkata_Premium_Menu.pdf. Nothing invented, nothing silently changed.
 * Prices are proposed launch prices and are editable in Admin → Menu.
 */

export const CATEGORIES = [
  { id: 'hookah',           name: 'Signature Hookah',  blurb: 'Charcoal, ice and slow conversation.',            sortOrder: 1,  active: true, image: 'hookah-art' },
  { id: 'hookah-combos',    name: 'Hookah Combos',     blurb: 'A bowl, something to eat, something to sip.',     sortOrder: 2,  active: true, image: 'water-wall' },
  { id: 'starters-veg',     name: 'Veg Starters',      blurb: 'Small plates that hit the table first.',          sortOrder: 3,  active: true, image: 'bar-counter' },
  { id: 'starters-nonveg',  name: 'Non-Veg Starters',  blurb: 'Grilled, fried, glazed. Built for sharing.',      sortOrder: 4,  active: true, image: 'lounge-wide' },
  { id: 'platters',         name: 'Sharing Platters',  blurb: 'One order, one table, no negotiation.',           sortOrder: 5,  active: true, image: 'tree-lounge' },
  { id: 'pizza',            name: 'Pizza',             blurb: 'Eight inches, thin base, loaded edge to edge.',   sortOrder: 6,  active: true, image: 'bar-gold' },
  { id: 'pasta',            name: 'Pasta',             blurb: 'Red, white or garlic and chilli.',                sortOrder: 7,  active: true, image: 'corridor' },
  { id: 'asian',            name: 'Asian',             blurb: 'Wok-tossed, fast, familiar.',                     sortOrder: 8,  active: true, image: 'window-lounge' },
  { id: 'indian',           name: 'Indian Comfort',    blurb: 'Biryani, butter chicken, and two hot rotis.',     sortOrder: 9,  active: true, image: 'tram-wall' },
  { id: 'mocktails',        name: 'Mocktails',         blurb: 'Built to look good in the photo you will take.',  sortOrder: 10, active: true, image: 'mural-neon' },
  { id: 'shakes',           name: 'Shakes & Coolers',  blurb: 'Cold coffee, thick shakes, tall glasses.',        sortOrder: 11, active: true, image: 'washroom-neon' },
  { id: 'desserts',         name: 'Desserts',          blurb: 'The last thing you order and the first you finish.', sortOrder: 12, active: true, image: 'arch-cabins' },
  { id: 'combos',           name: 'Value Combos',      blurb: 'Priced for four people and one bill.',            sortOrder: 13, active: true, image: 'rooftop' }
];

/**
 * Customization groups. Nothing here is hard-coded into the UI — the modal
 * renders whatever the admin defines.
 */
export const CUSTOMIZATIONS = [
  {
    id: 'cz_spice', name: 'Spice level', type: 'single', required: false, active: true,
    options: [
      { id: 'mild',   label: 'Mild',   price: 0 },
      { id: 'medium', label: 'Medium', price: 0 },
      { id: 'hot',    label: 'Hot',    price: 0 }
    ]
  },
  {
    id: 'cz_addons', name: 'Add-ons', type: 'multi', required: false, active: true,
    options: [
      { id: 'cheese',  label: 'Extra Cheese',  price: 40 },
      { id: 'chicken', label: 'Extra Chicken', price: 80 },
      { id: 'paneer',  label: 'Extra Paneer',  price: 60 },
      { id: 'sauce',   label: 'Extra Sauce',   price: 20 }
    ]
  },
  {
    id: 'cz_wings', name: 'Choose flavour', type: 'single', required: true, active: true,
    options: [
      { id: 'hot',  label: 'Hot',       price: 0 },
      { id: 'bbq',  label: 'BBQ',       price: 0 },
      { id: 'peri', label: 'Peri-Peri', price: 0 }
    ]
  },
  {
    id: 'cz_loaded', name: 'Veg or chicken', type: 'single', required: true, active: true,
    options: [
      { id: 'veg',     label: 'Veg',     price: 0 },
      { id: 'chicken', label: 'Chicken', price: 0 }
    ]
  },
  {
    id: 'cz_ice', name: 'Bowl setup', type: 'single', required: false, active: true,
    options: [
      { id: 'regular', label: 'Regular base', price: 0 },
      { id: 'ice',     label: 'Ice base',     price: 49 },
      { id: 'fruit',   label: 'Fruit bowl',   price: 99 }
    ]
  }
];

const item = (id, categoryId, name, description, price, extra = {}) => ({
  id, categoryId, name, description, price,
  discountPrice: null,
  image: '', thumbnail: '', galleryImage: '',
  veg: true,
  spiceLevel: 0,
  preparationTime: 15,
  popular: false,
  featured: false,
  available: true,
  customizations: [],
  sortOrder: 0,
  ...extra
});

const nv = { veg: false };

export const PRODUCTS = [
  /* ---- Signature hookah (₹ from PDF) ---- */
  item('p_hk_mint',    'hookah', 'Classic Mint',   'Cool, clean and refreshing.',                            399, { preparationTime: 10, popular: true, customizations: ['cz_ice'] }),
  item('p_hk_apple',   'hookah', 'Double Apple',   'Rich apple-forward classic.',                            399, { preparationTime: 10, popular: true, customizations: ['cz_ice'] }),
  item('p_hk_blue',    'hookah', 'Blueberry Mint', 'Sweet berry with a cool finish.',                        449, { preparationTime: 10, customizations: ['cz_ice'] }),
  item('p_hk_paan',    'hookah', 'Paan Twist',     'Indian paan-inspired aromatic blend.',                   449, { preparationTime: 10, featured: true, customizations: ['cz_ice'] }),
  item('p_hk_mango',   'hookah', 'Mango Chill',    'Juicy mango with a chilled finish.',                     449, { preparationTime: 10, customizations: ['cz_ice'] }),
  item('p_hk_grape',   'hookah', 'Grape Mint',     'Fruity grape balanced with mint.',                       449, { preparationTime: 10, customizations: ['cz_ice'] }),
  item('p_hk_special', 'hookah', 'Zen G Special',  "Signature house blend; ask the team for today's profile.", 549, { preparationTime: 12, featured: true, popular: true, customizations: ['cz_ice'] }),
  item('p_hk_premium', 'hookah', 'Zen G Premium',  'Premium bowl / upgraded presentation.',                  649, { preparationTime: 12, featured: true, customizations: ['cz_ice'] }),

  /* ---- Hookah combos ---- */
  item('p_hc_chill',   'hookah-combos', 'Chill Combo',   '1 Classic Hookah + French Fries + 2 Soft Drinks',    599, { preparationTime: 18, popular: true }),
  item('p_hc_connect', 'hookah-combos', 'Connect Combo', '1 Premium Hookah + Loaded Nachos + 2 Mocktails',     799, { preparationTime: 20, featured: true }),
  item('p_hc_create',  'hookah-combos', 'Create Combo',  '1 Signature Hookah + Sharing Platter + 4 Soft Drinks', 999, { preparationTime: 25, featured: true }),

  /* ---- Veg starters ---- */
  item('p_vs_fries',   'starters-veg', 'Peri Peri Fries',        'Crispy fries, peri-peri dust, house dip.',            149, { spiceLevel: 2, preparationTime: 12, popular: true, customizations: ['cz_addons'] }),
  item('p_vs_toast',   'starters-veg', 'Cheese Chilli Toast',    'Cheesy toast with chilli, herbs and seasoning.',      179, { spiceLevel: 1, preparationTime: 12, customizations: ['cz_addons'] }),
  item('p_vs_corn',    'starters-veg', 'Crispy Corn',            'Golden corn with chilli, herbs and tangy seasoning.', 189, { spiceLevel: 1, preparationTime: 14, popular: true }),
  item('p_vs_paneer',  'starters-veg', 'Paneer Tikka',           'Smoky paneer, peppers and onions.',                   249, { spiceLevel: 1, preparationTime: 18, featured: true, customizations: ['cz_spice', 'cz_addons'] }),
  item('p_vs_babycorn','starters-veg', 'Crispy Chilli Babycorn', 'Crispy babycorn in a sweet-spicy glaze.',             229, { spiceLevel: 2, preparationTime: 15 }),
  item('p_vs_nachos',  'starters-veg', 'Loaded Nachos',          'Nachos, cheese, salsa, jalapeño and house dip.',      249, { spiceLevel: 1, preparationTime: 12, popular: true, featured: true, customizations: ['cz_addons'] }),

  /* ---- Non-veg starters ---- */
  item('p_ns_popcorn', 'starters-nonveg', 'Chicken Popcorn',   'Crispy bite-size chicken with signature dip.',    229, { ...nv, spiceLevel: 1, preparationTime: 14, popular: true, customizations: ['cz_addons'] }),
  item('p_ns_wings',   'starters-nonveg', 'Chicken Wings',     'Six wings: hot, BBQ or peri-peri.',               269, { ...nv, spiceLevel: 2, preparationTime: 18, popular: true, featured: true, customizations: ['cz_wings', 'cz_addons'] }),
  item('p_ns_lolly',   'starters-nonveg', 'Chicken Lollipop',  'Crispy lollipops with house chilli glaze.',       289, { ...nv, spiceLevel: 2, preparationTime: 18 }),
  item('p_ns_chilli',  'starters-nonveg', 'Chilli Chicken',    'Indo-Chinese favourite with peppers and onion.',  279, { ...nv, spiceLevel: 2, preparationTime: 16, customizations: ['cz_spice'] }),
  item('p_ns_tikka',   'starters-nonveg', 'Chicken Tikka',     'Char-grilled tikka with mint chutney.',           299, { ...nv, spiceLevel: 1, preparationTime: 20, featured: true, customizations: ['cz_spice'] }),
  item('p_ns_shashlik','starters-nonveg', 'Chicken Shashlik',  'Chicken, peppers and onion grilled together.',    329, { ...nv, spiceLevel: 1, preparationTime: 20 }),

  /* ---- Sharing platters ---- */
  item('p_pl_veg',   'platters', 'Veg Chill Platter',     'Paneer tikka + crispy corn + fries + nachos + dips.',  499, { preparationTime: 25, featured: true, customizations: ['cz_addons'] }),
  item('p_pl_chick', 'platters', 'Chicken Social Platter','Wings + popcorn + lollipop + fries + dip.',            599, { ...nv, preparationTime: 25, popular: true, featured: true, customizations: ['cz_addons'] }),
  item('p_pl_mixed', 'platters', 'Zen G Mixed Platter',   'Paneer tikka + chicken wings + nachos + fries + dips.',699, { ...nv, preparationTime: 28, popular: true, featured: true, customizations: ['cz_addons'] }),

  /* ---- Pizza ---- */
  item('p_pz_marg',   'pizza', 'Margherita',        'Tomato, mozzarella and basil.',                 249, { preparationTime: 18, customizations: ['cz_addons'] }),
  item('p_pz_farm',   'pizza', 'Farmhouse',         'Capsicum, onion, corn, mushroom and cheese.',   299, { preparationTime: 20, popular: true, customizations: ['cz_addons'] }),
  item('p_pz_paneer', 'pizza', 'Paneer Tikka Pizza','Tandoori paneer, onion, capsicum and cheese.',  329, { preparationTime: 20, customizations: ['cz_addons'] }),
  item('p_pz_bbq',    'pizza', 'Chicken BBQ Pizza', 'Chicken, BBQ sauce, onion and mozzarella.',     349, { ...nv, preparationTime: 20, popular: true, featured: true, customizations: ['cz_addons'] }),
  item('p_pz_loaded', 'pizza', 'Zen G Loaded Pizza','House-loaded veg or chicken option.',           379, { preparationTime: 22, featured: true, customizations: ['cz_loaded', 'cz_addons'] }),

  /* ---- Pasta ---- */
  item('p_pa_aglio',  'pasta', 'Aglio e Olio',    'Garlic, olive oil, herbs and chilli.',  249, { spiceLevel: 1, preparationTime: 18, customizations: ['cz_spice', 'cz_addons'] }),
  item('p_pa_arrab',  'pasta', 'Arrabbiata',      'Tomato, garlic, chilli and herbs.',     249, { spiceLevel: 2, preparationTime: 18, customizations: ['cz_spice', 'cz_addons'] }),
  item('p_pa_alfredo','pasta', 'Alfredo',         'Creamy white sauce, herbs and cheese.', 279, { preparationTime: 18, popular: true, customizations: ['cz_addons'] }),
  item('p_pa_chick',  'pasta', 'Chicken Alfredo', 'Creamy pasta with grilled chicken.',    329, { ...nv, preparationTime: 20, popular: true, customizations: ['cz_addons'] }),

  /* ---- Asian ---- */
  item('p_as_vnood',  'asian', 'Veg Hakka Noodles',     'Wok-tossed noodles with vegetables.', 229, { spiceLevel: 1, preparationTime: 15 }),
  item('p_as_cnood',  'asian', 'Chicken Hakka Noodles', 'Wok-tossed noodles with chicken.',    259, { ...nv, spiceLevel: 1, preparationTime: 16, popular: true }),
  item('p_as_vrice',  'asian', 'Veg Fried Rice',        'Wok-fried rice with vegetables.',     219, { preparationTime: 15 }),
  item('p_as_crice',  'asian', 'Chicken Fried Rice',    'Wok-fried rice with chicken.',        249, { ...nv, preparationTime: 16 }),
  item('p_as_schez',  'asian', 'Schezwan Paneer',       'Paneer in spicy Schezwan sauce.',     269, { spiceLevel: 3, preparationTime: 18, customizations: ['cz_spice'] }),
  item('p_as_chilli', 'asian', 'Chilli Chicken',        'Crispy chicken, peppers and onion.',  279, { ...nv, spiceLevel: 2, preparationTime: 18, popular: true, customizations: ['cz_spice'] }),

  /* ---- Indian comfort ---- */
  item('p_in_cbir',   'indian', 'Chicken Biryani',       'Kolkata-style chicken biryani with egg.', 299, { ...nv, spiceLevel: 2, preparationTime: 22, popular: true, featured: true }),
  item('p_in_pbir',   'indian', 'Paneer Biryani',        'Aromatic veg biryani with paneer.',       269, { spiceLevel: 2, preparationTime: 22 }),
  item('p_in_butter', 'indian', 'Butter Chicken + 2 Roti','Creamy tomato-based chicken curry.',     329, { ...nv, spiceLevel: 1, preparationTime: 22, popular: true }),
  item('p_in_dal',    'indian', 'Dal Makhani + 2 Roti',  'Slow-cooked black lentils.',              249, { preparationTime: 20 }),

  /* ---- Mocktails ---- */
  item('p_mk_blue',   'mocktails', 'Zen G Blue',      'Blue citrus cooler with lemon and mint.', 169, { preparationTime: 8, popular: true, featured: true }),
  item('p_mk_sunset', 'mocktails', 'Kolkata Sunset',  'Orange, fruit blend and citrus.',         189, { preparationTime: 8, featured: true }),
  item('p_mk_paan',   'mocktails', 'Paan Mojito',     'Paan-inspired cooler with mint and lime.',199, { preparationTime: 8, popular: true }),
  item('p_mk_apple',  'mocktails', 'Green Apple Fizz','Green apple, lemon and soda.',            179, { preparationTime: 7 }),
  item('p_mk_berry',  'mocktails', 'Berry Blast',     'Mixed berry cooler with citrus.',         199, { preparationTime: 8 }),
  item('p_mk_melon',  'mocktails', 'Watermelon Mint', 'Fresh watermelon, mint and lime.',        179, { preparationTime: 8 }),

  /* ---- Shakes & coolers ---- */
  item('p_sh_coffee', 'shakes', 'Classic Cold Coffee', 'Creamy chilled coffee.',            159, { preparationTime: 7, popular: true }),
  item('p_sh_kitkat', 'shakes', 'KitKat Shake',        'Chocolate shake with crunchy wafer.',199, { preparationTime: 8, popular: true }),
  item('p_sh_oreo',   'shakes', 'Oreo Shake',          'Cookies-and-cream style shake.',     199, { preparationTime: 8 }),
  item('p_sh_mango',  'shakes', 'Mango Cream Shake',   'Mango and creamy vanilla profile.',  199, { preparationTime: 8 }),

  /* ---- Desserts ---- */
  item('p_de_brownie','desserts', 'Brownie with Ice Cream',    'Warm brownie, vanilla ice cream and sauce.', 199, { preparationTime: 10, popular: true, featured: true }),
  item('p_de_mousse', 'desserts', 'Chocolate Mousse',          'Rich chocolate dessert.',                    169, { preparationTime: 6 }),
  item('p_de_gulab',  'desserts', 'Gulab Jamun with Ice Cream','Indian classic served chilled.',             179, { preparationTime: 8 }),

  /* ---- Value combos ---- */
  item('p_cb_student','combos', 'Student Chill',  'Fries + soft drink + veg starter.',              299, { preparationTime: 18, popular: true, featured: true }),
  item('p_cb_date',   'combos', 'Date Night',     'Pizza + 2 mocktails + dessert.',                 699, { preparationTime: 25, featured: true }),
  item('p_cb_friends','combos', 'Friends 4',      'Sharing platter + pizza + 4 soft drinks.',       899, { ...nv, preparationTime: 30, popular: true }),
  item('p_cb_party',  'combos', 'Zen G Party 6',  '2 sharing platters + 2 pizzas + 6 soft drinks.', 1499, { ...nv, preparationTime: 35, featured: true })
].map((row, index) => ({ ...row, sortOrder: index }));

/** Twelve tables to start; add, rename or remove them in Admin → Tables. */
export const TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `t_${String(i + 1).padStart(2, '0')}`,
  name: String(i + 1).padStart(2, '0'),
  capacity: i < 6 ? 4 : i < 10 ? 6 : 8,
  zone: i < 6 ? 'Lounge' : i < 10 ? 'Cabins' : 'Rooftop',
  active: true
}));

export const GALLERY = [
  { id: 'g1',  src: 'tree-lounge.jpg',    caption: 'The tree room',            tag: 'Interior',  sortOrder: 1,  active: true },
  { id: 'g2',  src: 'exterior-night.jpg', caption: 'Street side after dark',   tag: 'Exterior',  sortOrder: 2,  active: true },
  { id: 'g3',  src: 'arch-cabins.jpg',    caption: 'Think. Talk. Repeat.',     tag: 'Interior',  sortOrder: 3,  active: true },
  { id: 'g4',  src: 'mural-neon.jpg',     caption: 'Same souls, different stories', tag: 'Art',  sortOrder: 4,  active: true },
  { id: 'g5',  src: 'rooftop.jpg',        caption: 'Rooftop, city lights',     tag: 'Rooftop',   sortOrder: 5,  active: true },
  { id: 'g6',  src: 'bar-counter.jpg',    caption: 'Good company, better conversations', tag: 'Bar', sortOrder: 6, active: true },
  { id: 'g7',  src: 'water-wall.jpg',     caption: 'Pause. Puff. People.',     tag: 'Interior',  sortOrder: 7,  active: true },
  { id: 'g8',  src: 'hookah-art.jpg',     caption: 'The hookah wall',          tag: 'Hookah',    sortOrder: 8,  active: true },
  { id: 'g9',  src: 'tram-wall.jpg',      caption: 'Kolkata on the wall',      tag: 'Art',       sortOrder: 9,  active: true },
  { id: 'g10', src: 'corridor.jpg',       caption: 'This must be the place',   tag: 'Interior',  sortOrder: 10, active: true },
  { id: 'g11', src: 'lounge-wide.jpg',    caption: 'The long lounge',          tag: 'Interior',  sortOrder: 11, active: true },
  { id: 'g12', src: 'window-lounge.jpg',  caption: 'Window seats',             tag: 'Interior',  sortOrder: 12, active: true },
  { id: 'g13', src: 'bar-gold.jpg',       caption: 'Exhale the stress',        tag: 'Bar',       sortOrder: 13, active: true },
  { id: 'g14', src: 'mural-green.jpg',    caption: 'Good vibes, better company', tag: 'Art',     sortOrder: 14, active: true },
  { id: 'g15', src: 'washroom-neon.jpg',  caption: 'Even the washroom',        tag: 'Interior',  sortOrder: 15, active: true },
  { id: 'g16', src: 'facade-street.jpg',  caption: 'Hookah. Food. Music.',     tag: 'Exterior',  sortOrder: 16, active: true }
];

/** Sample events so the page is not empty on day one. Edit in Admin → Events. */
export const EVENTS = [
  { id: 'e1', name: 'College Night',  date: '', time: '8:00 PM', kind: 'College Night', image: 'mural-neon.jpg',
    description: 'Student ID at the door. House DJ, group tables, combo pricing all night.', active: true },
  { id: 'e2', name: 'Live Acoustic',  date: '', time: '9:00 PM', kind: 'Live Music', image: 'bar-counter.jpg',
    description: 'Two sets, one guitar, no cover charge. Book a lounge table early.', active: true },
  { id: 'e3', name: 'Rooftop Sundown',date: '', time: '6:30 PM', kind: 'Special Event', image: 'rooftop.jpg',
    description: 'Golden hour on the terrace with the skyline behind you.', active: true }
];

export const OFFERS = [
  { id: 'o1', name: 'Launch week', code: 'ZEN10', discount: 10, type: 'percent',
    startDate: '', endDate: '', minimumOrder: 500, categoryId: '', active: true,
    note: 'Ten percent off orders over ₹500.' }
];

/**
 * Settings. Contact details are intentionally blank rather than invented —
 * fill them in at /admin/settings before you share the site.
 */
export const SETTINGS = {
  id: 'main',
  restaurantName: 'Zen G Café',
  tagline: 'Chill. Connect. Create.',
  strapline: "More than a café. It's a vibe.",
  logo: 'assets/img/logo.png',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: 'Kolkata',
  maps: '',
  instagram: 'https://instagram.com/REPLACE_WITH_ZENG_ACCOUNT',
  facebook: 'https://facebook.com/REPLACE_WITH_ZENG_ACCOUNT',
  youtube: 'https://youtube.com/@REPLACE_WITH_ZENG_ACCOUNT',
  openingHours: [
    { day: 'Monday',    open: '12:00', close: '23:00', closed: false },
    { day: 'Tuesday',   open: '12:00', close: '23:00', closed: false },
    { day: 'Wednesday', open: '12:00', close: '23:00', closed: false },
    { day: 'Thursday',  open: '12:00', close: '23:00', closed: false },
    { day: 'Friday',    open: '12:00', close: '23:59', closed: false },
    { day: 'Saturday',  open: '12:00', close: '23:59', closed: false },
    { day: 'Sunday',    open: '12:00', close: '23:00', closed: false }
  ],
  heroImage: 'assets/img/hero-main.jpg',
  heroImageMobile: 'assets/img/hero-mobile.jpg',
  heroVideo: '/assets/hero.mp4',
  dineIn: true,
  takeaway: true,
  delivery: true,
  deliveryRadiusNote: 'Delivery is confirmed on WhatsApp before we start cooking.',
  minOrderDelivery: 0,
  taxNote: 'Prices are proposed launch prices and exclude applicable taxes and service charges.',
  hookahEnabled: true,
  hookahNotice:
    'Hookah service is offered only where permitted by applicable law and licensing, ' +
    'to guests aged 18 and above, and subject to venue rules. Smoking is harmful. ' +
    'Zen G makes no health claims about hookah.',
  // No default credential ships in the source. The first visit to /admin/login
  // asks you to set one, and only a salted hash is ever stored.
  adminPasscodeHash: '',
  adminPasscodeSalt: '',
  orderSequence: 0
};
