import { $, $$, esc } from '../core/dom.js';
import { icons } from '../components/icons.js';
import { footerHTML } from '../components/chrome.js';
import { rupee, normalisePhone, isPincode } from '../core/format.js';
import { getSettings, whatsappNumber } from '../services/settingsService.js';
import { getCart, totals, lineAmount, clearCart } from '../services/cartService.js';
import { getContext, setContext, clearContext } from '../services/orderContext.js';
import { listTables } from '../services/tableService.js';
import { createOrder, orderWhatsappUrl, buildWhatsappMessage } from '../services/orderService.js';
import { toastErr } from '../components/toast.js';
import { go } from '../core/router.js';

const TYPES = [
  { key: 'dine-in',  label: 'Dine-in',       note: "You're here. We bring it over.",       icon: 'chair',   flag: 'dineIn' },
  { key: 'takeaway', label: 'Takeaway',      note: 'Collect at the counter.',              icon: 'bagTake', flag: 'takeaway' },
  { key: 'delivery', label: 'Home delivery', note: 'We confirm your area on WhatsApp.',    icon: 'bike',    flag: 'delivery' }
];

export async function checkoutPage(outlet) {
  const [settings, tables] = await Promise.all([getSettings(), listTables({ activeOnly: true })]);
  const cart = getCart();
  const sums = totals(cart);

  if (!cart.lines.length) {
    outlet.innerHTML = `
      <div class="state" style="padding-top:calc(var(--header-h) + 18vh)">
        <h3>Nothing to send yet</h3>
        <p class="muted">Add a few things and come back — this page needs an order to work with.</p>
        <a class="btn btn--gold" href="/menu">Open the menu</a>
      </div>${footerHTML(settings)}`;
    return;
  }

  const context = getContext();
  const available = TYPES.filter((t) => settings[t.flag] !== false);
  const chosen = available.some((t) => t.key === context.orderType) ? context.orderType : (available[0]?.key || '');
  const waConfigured = Boolean(whatsappNumber(settings));

  outlet.innerHTML = `
<div class="page-head shell">
  <p class="sect__kicker">Last step</p>
  <h1>Where is this going?</h1>
</div>

<div class="shell" style="margin-bottom:var(--s-9)">
  ${waConfigured ? '' : `
    <p class="notice notice--warn" style="margin-bottom:var(--s-5)">
      <strong>WhatsApp ordering is not switched on yet.</strong>
      No WhatsApp number has been saved, so the order cannot be sent. Staff: add one in
      Admin &rarr; Settings. Your order is still saved and can be read out over the phone.
    </p>`}

  <div class="checkout">
    <form data-form novalidate>
      <div class="otype" role="radiogroup" aria-label="Order type" style="margin-bottom:var(--s-6)">
        ${available.map((type) => `
          <button class="otype__card${chosen === type.key ? ' is-on' : ''}" type="button" role="radio"
                  aria-checked="${chosen === type.key}" data-type="${type.key}">
            <i>${icons.check}</i>${icons[type.icon]}
            <b>${type.label}</b><span>${esc(type.note)}</span>
          </button>`).join('')}
      </div>

      ${context.tableName ? `
        <div class="table-flag" data-table-flag>
          <span>Table</span><b>${esc(context.tableName)}</b><span>scanned</span>
        </div>` : ''}

      <div class="field-row">
        <label class="field">
          <span class="label">Your name <span class="req">*</span></span>
          <input name="customerName" type="text" autocomplete="name" required placeholder="Who is this for?">
          <span class="field-error" data-error="customerName"></span>
        </label>
        <label class="field">
          <span class="label">Mobile number <span class="req">*</span></span>
          <input name="mobile" type="tel" inputmode="numeric" autocomplete="tel" required placeholder="10 digits">
          <span class="field-error" data-error="mobile"></span>
        </label>
      </div>

      <!-- Dine-in -->
      <div data-block="dine-in" hidden>
        ${context.tableName ? '' : `
          <label class="field">
            <span class="label">Table number</span>
            <select name="tableId">
              <option value="">I'll tell the staff</option>
              ${tables.map((t) => `<option value="${esc(t.id)}">Table ${esc(t.name)}${t.zone ? ` — ${esc(t.zone)}` : ''}</option>`).join('')}
            </select>
          </label>`}
      </div>

      <!-- Takeaway -->
      <div data-block="takeaway" hidden>
        <label class="field">
          <span class="label">Pickup time</span>
          <input name="pickupTime" type="time">
          <span class="faint" style="font-size:.74rem">Leave it blank and we will start straight away.</span>
        </label>
      </div>

      <!-- Delivery -->
      <div data-block="delivery" hidden>
        <label class="field">
          <span class="label">Full address <span class="req">*</span></span>
          <textarea name="address" autocomplete="street-address" placeholder="Flat, building, street, area"></textarea>
          <span class="field-error" data-error="address"></span>
        </label>
        <div class="field-row">
          <label class="field">
            <span class="label">Landmark</span>
            <input name="landmark" type="text" placeholder="What is nearby?">
          </label>
          <label class="field">
            <span class="label">Pincode <span class="req">*</span></span>
            <input name="pincode" type="text" inputmode="numeric" maxlength="6" placeholder="700001">
            <span class="field-error" data-error="pincode"></span>
          </label>
        </div>
      </div>

      <label class="field">
        <span class="label">Anything we should know?</span>
        <textarea name="remarks" placeholder="Less spicy, no onion, ring the bell twice&hellip;"></textarea>
      </label>
    </form>

    <aside class="summary">
      <h3>Order summary</h3>
      ${cart.lines.map((line) => `
        <div class="summary__line">
          <span>
            ${esc(line.name)} &times; ${line.qty}
            ${line.selections.length ? `<small>${esc(line.selections.map((s) => s.label).join(', '))}</small>` : ''}
          </span>
          <span>${rupee(lineAmount(line))}</span>
        </div>`).join('')}

      <div class="totals" style="margin-top:var(--s-4)"><span>Subtotal</span><span>${rupee(sums.subtotal)}</span></div>
      ${sums.discount ? `<div class="totals"><span>Discount ${esc(cart.coupon?.code || '')}</span><span>&minus;${rupee(sums.discount)}</span></div>` : ''}
      <div class="totals grand"><span>Total</span><span>${rupee(sums.total)}</span></div>

      <button class="btn btn--gold btn--block" type="button" data-send ${waConfigured ? '' : 'disabled'}>
        Send order on WhatsApp
      </button>
      <button class="btn btn--quiet btn--block" type="button" data-copy style="margin-top:8px">
        Copy the order text instead
      </button>
      <p class="faint" style="font-size:.74rem;margin:12px 0 0">
        Nothing is charged here. We confirm the total on WhatsApp before the kitchen starts.
      </p>
    </aside>
  </div>
</div>
${footerHTML(settings)}`;

  wire(outlet, { settings, tables, chosen, context });
}

function wire(outlet, { settings, tables, chosen, context }) {
  const form = $('[data-form]', outlet);
  let orderType = chosen;

  const showBlocks = () => {
    $$('[data-block]', outlet).forEach((block) => { block.hidden = block.dataset.block !== orderType; });
  };

  $$('[data-type]', outlet).forEach((card) => card.addEventListener('click', () => {
    orderType = card.dataset.type;
    $$('[data-type]', outlet).forEach((c) => {
      const on = c === card;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-checked', String(on));
    });
    setContext({ orderType });
    showBlocks();
  }));
  showBlocks();

  const setError = (field, message) => {
    const slot = $(`[data-error="${field}"]`, outlet);
    if (slot) slot.textContent = message || '';
    const input = form.elements[field];
    if (input) input.classList.toggle('input-invalid', Boolean(message));
  };

  function collect() {
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = {};

    if (!String(data.customerName || '').trim()) errors.customerName = 'We need a name for the order.';

    const phone = normalisePhone(data.mobile);
    if (!phone.valid) errors.mobile = 'Enter a 10-digit Indian mobile number.';

    if (orderType === 'delivery') {
      if (String(data.address || '').trim().length < 10) errors.address = 'Add enough address for a rider to find you.';
      if (!isPincode(data.pincode)) errors.pincode = 'Enter a valid 6-digit pincode.';
    }

    ['customerName', 'mobile', 'address', 'pincode'].forEach((f) => setError(f, errors[f]));

    const table = context.tableId
      ? { tableId: context.tableId, tableName: context.tableName }
      : (() => {
          const found = tables.find((t) => t.id === data.tableId);
          return found ? { tableId: found.id, tableName: found.name } : { tableId: '', tableName: '' };
        })();

    return {
      errors,
      input: {
        ...data,
        customerName: String(data.customerName || '').trim(),
        mobile: phone.local || String(data.mobile || '').trim(),
        orderType,
        ...(orderType === 'dine-in' ? table : { tableId: '', tableName: '' })
      }
    };
  }

  const firstErrorField = (errors) => Object.keys(errors)[0];

  $('[data-send]', outlet).addEventListener('click', async () => {
    const { errors, input } = collect();
    if (Object.keys(errors).length) {
      toastErr(errors[firstErrorField(errors)]);
      form.elements[firstErrorField(errors)]?.focus();
      return;
    }

    const button = $('[data-send]', outlet);
    button.disabled = true;
    button.textContent = 'Sending…';

    try {
      const order = await createOrder(input, getCart());
      const url = orderWhatsappUrl(order, settings);
      clearCart();
      clearContext();

      if (url) {
        // Opened before navigating so the tab is not blocked as a popup.
        const win = window.open(url, '_blank', 'noopener');
        if (!win) window.location.href = url;
      }
      go(`/order-success?id=${encodeURIComponent(order.id)}`);
    } catch (error) {
      console.error(error);
      button.disabled = false;
      button.textContent = 'Send order on WhatsApp';
      toastErr('That did not go through. Try again, or message us directly.');
    }
  });

  $('[data-copy]', outlet).addEventListener('click', async () => {
    const { errors, input } = collect();
    if (Object.keys(errors).length) {
      toastErr(errors[firstErrorField(errors)]);
      return;
    }
    const order = await createOrder(input, getCart());
    const text = buildWhatsappMessage(order, settings);
    try {
      await navigator.clipboard.writeText(text);
      clearCart();
      go(`/order-success?id=${encodeURIComponent(order.id)}`);
    } catch {
      window.prompt('Copy this and send it to us:', text);
    }
  });
}
