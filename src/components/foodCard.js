import { esc } from '../core/dom.js';
import { rupee } from '../core/format.js';
import { imageFor } from '../core/placeholder.js';
import { effectivePrice } from '../services/menuService.js';

const chilli = (level) =>
  level > 0
    ? `<span class="chilli" title="Spice level ${level} of 3" aria-label="Spice level ${level} of 3">${
        [1, 2, 3].map((n) => `<span class="${n <= level ? 'on' : ''}"></span>`).join('')
      }</span>`
    : '';

/**
 * @param {object} product
 * @param {boolean} eager first screenful loads eagerly, everything else lazily
 */
export function foodCardHTML(product, eager = false) {
  const price = effectivePrice(product);
  const cut = price < Number(product.price) ? `<s>${rupee(product.price)}</s>` : '';
  const out = product.available === false;

  const badges = [
    product.popular && '<span class="badge badge--pop">Bestseller</span>',
    product.featured && !product.popular && '<span class="badge badge--feat">Signature</span>',
    out && '<span class="badge badge--out">Off the menu today</span>'
  ].filter(Boolean).join('');

  return `
<button class="food-card${out ? ' is-out' : ''}" data-product="${esc(product.id)}"
        aria-label="${esc(product.name)}, ${rupee(price)}${out ? ', not available' : ''}">
  <div class="food-card__media">
    ${badges ? `<div class="badge-row">${badges}</div>` : ''}
    <span class="diet ${product.veg === false ? 'diet--nonveg' : ''}"
          title="${product.veg === false ? 'Non-vegetarian' : 'Vegetarian'}"><i></i></span>
    <img src="${esc(imageFor(product))}" alt="${esc(product.name)}"
         loading="${eager ? 'eager' : 'lazy'}" decoding="async" width="400" height="300">
  </div>
  <div class="food-card__body">
    <h3 class="food-card__name">${esc(product.name)}</h3>
    <p class="food-card__desc">${esc(product.description || '')}</p>
    <div class="food-card__foot">
      <span class="price">${cut}${rupee(price)} ${chilli(product.spiceLevel)}</span>
      <span class="add-btn">${out ? 'Sold out' : '+ Add'}</span>
    </div>
  </div>
</button>`;
}

export const foodGridHTML = (items, eagerCount = 4) =>
  `<div class="food-grid">${items.map((p, i) => foodCardHTML(p, i < eagerCount)).join('')}</div>`;
