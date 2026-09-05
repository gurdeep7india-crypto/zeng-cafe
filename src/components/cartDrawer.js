import { el, $, esc, fill, trapFocus } from '../core/dom.js';
import { rupee } from '../core/format.js';
import { imageFor } from '../core/placeholder.js';
import { icons } from './icons.js';
import { getCart, onCart, setQty, removeLine, lineAmount, totals } from '../services/cartService.js';
import { go } from '../core/router.js';

let root = null;
let release = null;
let unwatch = null;

function ensure() {
  if (root) return root;
  root = el('div.cart', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Your order' },
    el('div.cart__veil', { onclick: closeCart }),
    el('div.cart__body'));
  document.body.append(root);
  return root;
}

function lineHTML(line) {
  const options = line.selections.map((s) => s.label).join(' · ');
  return `
<div class="cart-line" data-line="${esc(line.id)}">
  <img src="${esc(imageFor({ image: line.image, name: line.name, categoryId: line.categoryId }))}"
       alt="" width="68" height="68" loading="lazy">
  <div>
    <div class="cart-line__name">${esc(line.name)}</div>
    ${options ? `<div class="cart-line__opts">${esc(options)}</div>` : ''}
    <div class="cart-line__ctrl">
      <span class="qty qty--sm">
        <button type="button" data-q="-1" aria-label="One fewer ${esc(line.name)}">−</button>
        <output>${line.qty}</output>
        <button type="button" data-q="1" aria-label="One more ${esc(line.name)}">+</button>
      </span>
      <button class="cart-line__rm" type="button" data-rm>Remove</button>
    </div>
  </div>
  <div class="cart-line__price">${rupee(lineAmount(line))}</div>
</div>`;
}

function render() {
  const body = $('.cart__body', ensure());
  const cart = getCart();
  const sums = totals(cart);

  const empty = `
<div class="state">
  <h3>Nothing here yet</h3>
  <p class="muted">Pick something from the menu and it will show up here.</p>
  <a class="btn btn--gold" href="/menu" data-close-cart>Open the menu</a>
</div>`;

  fill(body, el('div', { style: { display: 'contents' }, html: `
  <div class="cart__head">
    <h3>Your order</h3>
    <button class="modal__close" type="button" data-close aria-label="Close" style="position:static">${icons.close}</button>
  </div>
  <div class="cart__scroll">
    ${cart.lines.length ? cart.lines.map(lineHTML).join('') : empty}
  </div>
  ${cart.lines.length ? `
  <div class="cart__foot">
    <p class="script gold" style="margin:0 0 10px">You're building a Zen G moment.</p>
    <div class="totals"><span>Subtotal (${sums.count} item${sums.count === 1 ? '' : 's'})</span><span>${rupee(sums.subtotal)}</span></div>
    ${sums.discount ? `<div class="totals"><span>Discount ${esc(cart.coupon?.code || '')}</span><span>−${rupee(sums.discount)}</span></div>` : ''}
    <div class="totals grand"><span>Total</span><span>${rupee(sums.total)}</span></div>
    <button class="btn btn--gold btn--block" type="button" data-checkout>Proceed to order</button>
    <p class="faint" style="font-size:.72rem;margin:10px 0 0;text-align:center">Taxes and charges are confirmed on WhatsApp before we start.</p>
  </div>` : ''}
  ` }));

  body.querySelectorAll('[data-close], [data-close-cart]').forEach((n) => n.addEventListener('click', closeCart));
  body.querySelector('[data-checkout]')?.addEventListener('click', () => { closeCart(); go('/checkout'); });

  body.querySelectorAll('.cart-line').forEach((row) => {
    const id = row.dataset.line;
    const line = cart.lines.find((l) => l.id === id);
    row.querySelectorAll('[data-q]').forEach((button) =>
      button.addEventListener('click', () => setQty(id, line.qty + Number(button.dataset.q))));
    row.querySelector('[data-rm]').addEventListener('click', () => removeLine(id));
  });
}

export function openCart() {
  const node = ensure();
  render();
  node.classList.add('is-open');
  document.body.classList.add('no-scroll');
  release = trapFocus($('.cart__body', node), closeCart);
  unwatch = onCart(render);
  $('.cart__body [data-close]', node)?.focus();
}

export function closeCart() {
  if (!root) return;
  root.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  release?.(); release = null;
  unwatch?.(); unwatch = null;
}
