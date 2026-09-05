/**
 * Food image placeholders.
 *
 * Until real photography exists, every dish gets a generated dark-cinematic
 * plate: black ground, warm side light, plate silhouette tinted per category.
 * Deterministic from the item name, so a dish always looks the same.
 *
 * These are stand-ins on purpose. Replace them in Admin → Menu → image.
 * Shoot to match: dark background, warm side light, steam, close crop.
 */

const PALETTE = {
  hookah:        ['#8b46ff', '#22d3ee'],
  'hookah-combos': ['#ec1e79', '#f2a007'],
  'starters-veg':  ['#2fbf71', '#f2a007'],
  'starters-nonveg': ['#ff6b3d', '#f2a007'],
  platters:      ['#f2a007', '#ec1e79'],
  pizza:         ['#e0392b', '#f2a007'],
  pasta:         ['#f2a007', '#ffd48a'],
  asian:         ['#2fbf71', '#22d3ee'],
  indian:        ['#ff8a3d', '#f2a007'],
  mocktails:     ['#22d3ee', '#8b46ff'],
  shakes:        ['#d9a441', '#ec1e79'],
  desserts:      ['#a2603a', '#f2a007'],
  combos:        ['#ec1e79', '#22d3ee'],
  default:       ['#f2a007', '#8b46ff']
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/**
 * @returns {string} an SVG data URI, ~1KB, safe for <img src>.
 */
export function placeholderImage(name = 'Zen G', categoryId = 'default') {
  const [warm, cool] = PALETTE[categoryId] || PALETTE.default;
  const seed = hash(name + categoryId);
  const tilt = (seed % 24) - 12;
  const plateY = 232 + (seed % 14);
  const glow = 0.34 + ((seed % 7) / 40);
  const initials = name.trim().slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
<defs>
<radialGradient id="g1" cx="72%" cy="18%" r="86%">
<stop offset="0%" stop-color="${warm}" stop-opacity="${glow}"/>
<stop offset="46%" stop-color="${cool}" stop-opacity=".10"/>
<stop offset="100%" stop-color="#050505" stop-opacity="1"/>
</radialGradient>
<linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="#ffffff" stop-opacity=".13"/>
<stop offset="100%" stop-color="#000000" stop-opacity=".55"/>
</linearGradient>
<radialGradient id="g3" cx="50%" cy="38%" r="60%">
<stop offset="0%" stop-color="${warm}" stop-opacity=".55"/>
<stop offset="100%" stop-color="${warm}" stop-opacity=".05"/>
</radialGradient>
</defs>
<rect width="400" height="300" fill="#050505"/>
<rect width="400" height="300" fill="url(#g1)"/>
<g transform="rotate(${tilt} 200 ${plateY})">
<ellipse cx="200" cy="${plateY}" rx="128" ry="42" fill="#000" opacity=".7"/>
<ellipse cx="200" cy="${plateY - 6}" rx="120" ry="38" fill="url(#g3)"/>
<ellipse cx="200" cy="${plateY - 6}" rx="120" ry="38" fill="none" stroke="${warm}" stroke-opacity=".38"/>
<ellipse cx="200" cy="${plateY - 10}" rx="74" ry="23" fill="#0d0d10" stroke="${warm}" stroke-opacity=".22"/>
</g>
<path d="M172 96q10-20 0-38M200 88q10-22 0-42M228 96q10-20 0-38" stroke="${cool}" stroke-opacity=".3" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<rect width="400" height="300" fill="url(#g2)"/>
<text x="200" y="${plateY - 2}" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-size="34" font-weight="800" fill="${warm}" fill-opacity=".5" letter-spacing="2">${initials}</text>
<text x="24" y="278" font-family="Archivo,Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="4" fill="#f4f1ec" fill-opacity=".38">ZEN G CAFÉ</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n/g, ''))}`;
}

/** Resolve an item's image, falling back to the generated plate. */
export function imageFor(item) {
  return item?.image || placeholderImage(item?.name || 'Zen G', item?.categoryId);
}
