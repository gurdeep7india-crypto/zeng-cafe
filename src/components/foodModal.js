import { el, $, $$, esc, fill, trapFocus } from '../core/dom.js';
import { rupee } from '../core/format.js';
import { imageFor } from '../core/placeholder.js';
import { icons } from './icons.js';
import { getProduct, groupsFor, effectivePrice, missingRequired } from '../services/menuService.js';
import { addLine } from '../services/cartService.js';
import { settingsNow } from '../services/settingsService.js';
import { toast, toastErr } from './toast.js';
import { openCart } from './cartDrawer.js';

let root = null;
let releaseTrap = null;
let lastFocus = null;

function ensure() {
  if (root) return root;
  root = el('div.modal', { id: 'food-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Dish details' },
    el('div.modal__veil', { onclick: closeFood }),
    el('div.modal__body'));
  document.body.append(root);
  return root;
}

export function closeFood() {
  if (!root) return;
  root.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  releaseTrap?.();
  releaseTrap = null;
  lastFocus?.focus?.();
}

export async function openFood(productId) {
  const product = await getProduct(productId);
  if (!product) { toastErr('That dish is no longer on the menu.'); return; }
  const groups = await groupsFor(product);
  const settings = settingsNow();

  lastFocus = document.activeElement;
  const node = ensure();
  const body = $('.modal__body', node);

  const state = { qty: 1, selections: [] };

  const groupHTML = groups.map((group) => `
    <fieldset class="optgroup" data-group="${esc(group.id)}">
      <div class="optgroup__head">
        <h4>${esc(group.name)}</h4>
        <span class="optgroup__hint">${group.required ? 'Pick one' : group.type === 'multi' ? 'Optional, pick any' : 'Optional'}</span>
      </div>
      <div class="optlist">
        ${group.options.map((option) => `
          <label class="opt">
            <input type="${group.type === 'multi' ? 'checkbox' : 'radio'}"
                   name="${esc(group.id)}" value="${esc(option.id)}"
                   data-price="${Number(option.price) || 0}" data-label="${esc(option.label)}">
            <span>${esc(option.label)}</span>
            ${Number(option.price) ? `<span class="plus">+${rupee(option.price)}</span>` : ''}
          </label>`).join('')}
      </div>
    </fieldset>`).join('');

  const price = effectivePrice(product);
  const isHookah = product.categoryId === 'hookah' || product.categoryId === 'hookah-combos';

  fill(body, el('div', { html: `
    <button class="modal__close" type="button" aria-label="Close">${icons.close}</button>
    <div class="detail">
      <div class="detail__media">
        <img src="${esc(imageFor(product))}" alt="${esc(product.name)}" width="600" height="600">
      </div>
      <div class="detail__pane">
        <h2 id="food-modal-title">${esc(product.name)}</h2>
        <div class="detail__meta">
          <span>${product.veg === false ? 'Non-veg' : 'Veg'}</span>
          ${product.spiceLevel ? `<span>Spice ${product.spiceLevel}/3</span>` : ''}
          <span>About ${Number(product.preparationTime) || 15} min</span>
          ${product.popular ? '<span class="gold">Bestseller</span>' : ''}
        </div>
        <p class="muted">${esc(product.description || '')}</p>
        ${isHookah && settings.hookahNotice ? `<p class="notice notice--warn">${esc(settings.hookahNotice)}</p>` : ''}
        ${product.available === false ? '<p class="notice">This one just left the kitchen. It will be back — everything else is still going.</p>' : ''}
        ${groupHTML}
        <div class="detail__cta">
          <div class="qty">
            <button type="button" data-step="-1" aria-label="One fewer">−</button>
            <output data-qty aria-live="polite">1</output>
            <button type="button" data-step="1" aria-label="One more">+</button>
          </div>
          <button class="btn btn--gold grow" type="button" data-add ${product.available === false ? 'disabled' : ''}>
            Add · <span data-total>${rupee(price)}</span>
          </button>
        </div>
      </div>
    </div>` }));

  const totalNode = $('[data-total]', body);
  const qtyNode = $('[data-qty]', body);

  function readSelections() {
    state.selections = $$('.optgroup input:checked', body).map((input) => {
      const group = groups.find((g) => g.id === input.closest('.optgroup').dataset.group);
      return {
        groupId: group.id,
        groupName: group.name,
        optionId: input.value,
        label: input.dataset.label,
        price: Number(input.dataset.price) || 0
      };
    });
    $$('.opt', body).forEach((label) => label.classList.toggle('is-on', label.querySelector('input').checked));
    const extras = state.selections.reduce((sum, s) => sum + s.price, 0);
    totalNode.textContent = rupee((price + extras) * state.qty);
  }

  body.addEventListener('change', readSelections);
  $('.modal__close', body).addEventListener('click', closeFood);

  $$('[data-step]', body).forEach((button) => button.addEventListener('click', () => {
    state.qty = Math.max(1, Math.min(30, state.qty + Number(button.dataset.step)));
    qtyNode.textContent = state.qty;
    readSelections();
  }));

  $('[data-add]', body).addEventListener('click', () => {
    const missing = missingRequired(groups, state.selections);
    if (missing.length) {
      toastErr(`Choose a ${missing[0].toLowerCase()} first.`);
      $(`.optgroup[data-group="${groups.find((g) => g.name === missing[0]).id}"]`, body)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    addLine(product, state.selections, state.qty);
    closeFood();
    toast(`${product.name} added. ${state.qty > 1 ? `${state.qty} of them.` : ''}`.trim());
  });

  readSelections();
  node.classList.add('is-open');
  document.body.classList.add('no-scroll');
  releaseTrap = trapFocus(body, closeFood);
  $('.modal__close', body).focus();
}

/** Delegate clicks from any food card on the page. */
export function bindFoodCards(scope = document.body) {
  scope.addEventListener('click', (event) => {
    const card = event.target.closest('.food-card[data-product]');
    if (!card) return;
    if (card.classList.contains('is-out')) { toast('This one just left the kitchen.'); return; }
    openFood(card.dataset.product);
  });
}

export { openCart };
