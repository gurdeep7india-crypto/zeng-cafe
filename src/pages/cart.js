import { $, $$, esc } from '../core/dom.js';
import { footerHTML } from '../components/chrome.js';
import { rupee } from '../core/format.js';
import { imageFor } from '../core/placeholder.js';
import { getSettings } from '../services/settingsService.js';
import { getCart, onCart, setQty, removeLine, lineAmount, totals, applyCoupon } from '../services/cartService.js';
import { validateCoupon } from '../services/offerService.js';
import { toast, toastErr, toastOk } from '../components/toast.js';
import { go } from '../core/router.js';

export async function cartPage(outlet) {
  const settings = await getSettings();

  outlet.innerHTML = `
<div class="page-head shell">
  <p class="sect__kicker">Almost there</p>
  <h1>Your order</h1>
</div>
<div class="shell" data-body></div>
${footerHTML(settings)}`;

  const body = $('[data-body]', outlet);

  function render(cart) {
    const sums = totals(cart);

    if (!cart.lines.length) {
      body.innerHTML = `
        <div class="state">
          <h3>Nothing here yet</h3>
          <p class="muted">Pick something from the menu and it will show up here.</p>
          <a class="btn btn--gold" href="/menu">Open the menu</a>
        </div>`;
      return;
    }

    body.innerHTML = `
    <div class="checkout">
      <div>
        ${cart.lines.map((line) => `
        <div class="cart-line" data-line="${esc(line.id)}">
          <img src="${esc(imageFor({ image: line.image, name: line.name, categoryId: line.categoryId }))}" alt="" width="68" height="68" loading="lazy">
          <div>
            <div class="cart-line__name">${esc(line.name)}</div>
            ${line.selections.length ? `<div class="cart-line__opts">${esc(line.selections.map((s) => s.label).join(' · '))}</div>` : ''}
            <div class="cart-line__ctrl">
              <span class="qty qty--sm">
                <button type="button" data-q="-1" aria-label="One fewer">&minus;</button>
                <output>${line.qty}</output>
                <button type="button" data-q="1" aria-label="One more">+</button>
              </span>
              <button class="cart-line__rm" type="button" data-rm>Remove</button>
            </div>
          </div>
          <div class="cart-line__price">${rupee(lineAmount(line))}</div>
        </div>`).join('')}
        <p class="script gold" style="margin-top:var(--s-5)">You're building a Zen G moment.</p>
      </div>

      <aside class="summary">
        <h3>Summary</h3>
        <div class="totals"><span>Subtotal (${sums.count} item${sums.count === 1 ? '' : 's'})</span><span>${rupee(sums.subtotal)}</span></div>
        ${sums.discount ? `<div class="totals"><span>Discount ${esc(cart.coupon?.code || '')}</span><span>&minus;${rupee(sums.discount)}</span></div>` : ''}
        <div class="totals grand"><span>Total</span><span>${rupee(sums.total)}</span></div>

        <div class="field">
          <label class="label" for="coupon">Have a code?</label>
          <div style="display:flex;gap:8px">
            <input id="coupon" type="text" placeholder="ZEN10" value="${esc(cart.coupon?.code || '')}" autocomplete="off">
            <button class="btn btn--ghost btn--sm" type="button" data-coupon>${cart.coupon ? 'Change' : 'Apply'}</button>
          </div>
          <span class="field-error" data-coupon-msg></span>
        </div>

        <button class="btn btn--gold btn--block" type="button" data-next>Proceed to order</button>
        <p class="faint" style="font-size:.74rem;margin:12px 0 0">${esc(settings.taxNote || '')}</p>
      </aside>
    </div>`;

    $$('.cart-line', body).forEach((row) => {
      const id = row.dataset.line;
      const line = cart.lines.find((l) => l.id === id);
      $$('[data-q]', row).forEach((b) => b.addEventListener('click', () => setQty(id, line.qty + Number(b.dataset.q))));
      $('[data-rm]', row).addEventListener('click', () => { removeLine(id); toast(`${line.name} removed.`); });
    });

    $('[data-next]', body).addEventListener('click', () => go('/checkout'));

    $('[data-coupon]', body).addEventListener('click', async () => {
      const code = $('#coupon', body).value.trim();
      const msg = $('[data-coupon-msg]', body);
      if (!code) { applyCoupon(null); msg.textContent = ''; return; }
      const result = await validateCoupon(code, sums.subtotal);
      if (!result.ok) { msg.textContent = result.reason; applyCoupon(null); return; }
      msg.textContent = '';
      applyCoupon(result.offer);
      toastOk(`${result.offer.code} applied.`);
    });
  }

  const stop = onCart(render);
  return stop;
}
