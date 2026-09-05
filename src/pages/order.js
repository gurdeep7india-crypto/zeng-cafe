import { $, $$, el, esc } from '../core/dom.js';
import { icons } from '../components/icons.js';
import { footerHTML } from '../components/chrome.js';
import { foodGridHTML } from '../components/foodCard.js';
import { buildMenu } from '../services/menuService.js';
import { getSettings } from '../services/settingsService.js';
import { findByName } from '../services/tableService.js';
import { getContext, setContext } from '../services/orderContext.js';
import { itemCount } from '../services/cartService.js';
import { go } from '../core/router.js';
import { toastErr } from '../components/toast.js';

const TYPES = [
  { key: 'dine-in',  label: 'Dine-in',       note: "You're here. We'll bring it to your table.", icon: 'chair',   flag: 'dineIn' },
  { key: 'takeaway', label: 'Takeaway',      note: 'Order ahead, collect at the counter.',       icon: 'bagTake', flag: 'takeaway' },
  { key: 'delivery', label: 'Home delivery', note: 'We confirm the area on WhatsApp first.',     icon: 'bike',    flag: 'delivery' }
];

export async function orderPage(outlet, ctx) {
  const [settings, groups] = await Promise.all([getSettings(), buildMenu()]);

  // A QR scan carries the table in the URL. Never make someone type it in.
  let table = null;
  const scanned = ctx.query.table;
  if (scanned) {
    table = await findByName(scanned);
    if (table) setContext({ orderType: 'dine-in', tableId: table.id, tableName: table.name });
  }

  const context = getContext();
  const available = TYPES.filter((t) => settings[t.flag] !== false);

  outlet.innerHTML = `
<div class="page-head shell">
  <p class="sect__kicker">Order the vibe</p>
  <h1>Build your order</h1>
  ${table ? `
    <div class="table-flag">
      <span>Table</span><b>${esc(table.name)}</b>
      <span>${esc(table.zone || '')}</span>
    </div>
    <p class="muted">You scanned the code at table ${esc(table.name)}. Order type is set to dine-in.</p>`
  : scanned ? `
    <p class="notice notice--warn">We could not find table ${esc(scanned)}. Pick how you want your order below and tell us the table in the notes.</p>`
  : '<p class="sect__lead">Pick how you want it, then add what you want. It goes to our WhatsApp at the end — no account, no app.</p>'}
</div>

<section class="sect--tight shell">
  <div class="otype" role="radiogroup" aria-label="Order type">
    ${available.map((type) => `
      <button class="otype__card${context.orderType === type.key ? ' is-on' : ''}" type="button"
              role="radio" aria-checked="${context.orderType === type.key}" data-type="${type.key}">
        <i>${icons.check}</i>
        ${icons[type.icon]}
        <b>${type.label}</b>
        <span>${esc(type.note)}</span>
      </button>`).join('')}
  </div>
  ${!available.length ? '<p class="notice">Online ordering is switched off right now. Call us instead.</p>' : ''}
</section>

<div class="catnav">
  <div class="catnav__scroll" role="tablist" aria-label="Menu sections">
    ${groups.map((g, i) => `
      <button type="button" role="tab" class="${i === 0 ? 'is-on' : ''}" data-cat="${esc(g.category.id)}"
              aria-selected="${i === 0}">${esc(g.category.name)}</button>`).join('')}
  </div>
</div>

<div class="shell">
  ${groups.map((group) => `
    <section class="menu-sect" id="cat-${esc(group.category.id)}" data-section="${esc(group.category.id)}">
      <div class="menu-sect__head">
        <h2>${esc(group.category.name)}</h2>
        <p>${esc(group.category.blurb || '')}</p>
      </div>
      ${group.category.id === 'hookah' && settings.hookahNotice
        ? `<p class="notice notice--warn" style="margin-bottom:var(--s-5)">${esc(settings.hookahNotice)}</p>` : ''}
      ${foodGridHTML(group.items, 4)}
    </section>`).join('')}

  <div style="position:sticky;bottom:88px;display:flex;justify-content:center;padding-bottom:var(--s-6)">
    <button class="btn btn--gold" type="button" data-go-checkout>Review and send order</button>
  </div>
</div>

${footerHTML(settings)}`;

  $$('[data-type]', outlet).forEach((card) => card.addEventListener('click', () => {
    $$('[data-type]', outlet).forEach((c) => { c.classList.remove('is-on'); c.setAttribute('aria-checked', 'false'); });
    card.classList.add('is-on');
    card.setAttribute('aria-checked', 'true');
    setContext({ orderType: card.dataset.type, ...(card.dataset.type === 'dine-in' ? {} : { tableId: '', tableName: '' }) });
  }));

  $$('.catnav button', outlet).forEach((button) => button.addEventListener('click', () => {
    document.getElementById(`cat-${button.dataset.cat}`)?.scrollIntoView({ behavior: 'smooth' });
    $$('.catnav button', outlet).forEach((b) => b.classList.toggle('is-on', b === button));
  }));

  $('[data-go-checkout]', outlet).addEventListener('click', () => {
    if (itemCount() === 0) { toastErr('Add something first — the cart is empty.'); return; }
    go('/checkout');
  });

  if (table) showQrWelcome(settings, table);
}

/** Full-screen greeting after a table scan, then straight into the menu. */
function showQrWelcome(settings, table) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const node = el('div.qr-welcome', { html: `
    <div>
      <b>Welcome to<br>Zen <span class="gold">G</span></b>
      <b class="tbl">Table ${esc(table.name)}</b>
      <small>Opening the menu</small>
    </div>` });
  document.body.append(node);
  document.body.classList.add('no-scroll');
  setTimeout(() => {
    node.classList.add('is-gone');
    document.body.classList.remove('no-scroll');
    setTimeout(() => node.remove(), 650);
  }, 1500);
}
