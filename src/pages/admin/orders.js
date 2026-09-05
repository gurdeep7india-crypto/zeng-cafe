import { $, $$, esc, fill, el } from '../../core/dom.js';
import { adminShell, confirmDialog, emptyState, closeDialog } from './shell.js';
import { rupee, fmtDate, fmtTime } from '../../core/format.js';
import { icons } from '../../components/icons.js';
import { listOrders, setStatus, deleteOrder, ORDER_STATUS, STATUS_LABEL, ORDER_TYPE_LABEL } from '../../services/orderService.js';
import { getSettings, whatsappLink } from '../../services/settingsService.js';
import { toastOk } from '../../components/toast.js';

const pillClass = (status) => ({
  new: 'new', confirmed: 'new', preparing: 'prep', ready: 'prep', completed: 'done', cancelled: 'cxl'
}[status] || 'off');

export async function adminOrdersPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Orders',
    lead: 'Every order the site has taken. Move them along as the kitchen works.',
    tools: `<select data-filter style="min-height:38px;max-width:180px">
              <option value="">All statuses</option>
              ${ORDER_STATUS.map((s) => `<option value="${s}">${STATUS_LABEL[s]}</option>`).join('')}
            </select>`
  });

  const settings = await getSettings();
  let filter = '';

  async function refresh() {
    const orders = await listOrders({ status: filter || null });

    content.innerHTML = orders.length ? `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Order</th><th>Customer</th><th>Type</th><th>Items</th><th>Total</th><th>Status</th><th>When</th><th></th></tr></thead>
        <tbody>
          ${orders.map((order) => `
          <tr>
            <td><strong>${esc(order.code)}</strong></td>
            <td>${esc(order.customerName)}<div class="faint" style="font-size:.72rem">${esc(order.mobile)}</div></td>
            <td>${esc(ORDER_TYPE_LABEL[order.orderType] || order.orderType)}
              ${order.tableName ? `<div class="faint" style="font-size:.72rem">Table ${esc(order.tableName)}</div>` : ''}</td>
            <td class="faint">${(order.items || []).reduce((n, i) => n + i.qty, 0)}</td>
            <td>${rupee(order.total)}</td>
            <td>
              <select data-status="${esc(order.id)}" style="min-height:34px;padding:6px 28px 6px 10px;font-size:.8rem;background-position:calc(100% - 16px) 15px,calc(100% - 11px) 15px">
                ${ORDER_STATUS.map((s) => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}
              </select>
            </td>
            <td class="faint" style="font-size:.74rem">${esc(fmtDate(order.createdAt, { day: '2-digit', month: 'short' }))}<br>${esc(fmtTime(order.createdAt))}</td>
            <td><div class="actions">
              <button class="btn btn--ghost btn--sm" type="button" data-view="${esc(order.id)}">View</button>
              <button class="btn btn--danger btn--sm" type="button" data-del="${esc(order.id)}">${icons.trash}</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`
    : emptyState(filter ? `Nothing at "${STATUS_LABEL[filter]}"` : 'No orders yet',
                 filter ? 'Try another status.' : 'Orders sent from the website land here automatically.');

    $$('[data-status]', content).forEach((select) => select.addEventListener('change', async () => {
      await setStatus(select.dataset.status, select.value);
      toastOk(`Moved to ${STATUS_LABEL[select.value]}.`);
      refresh();
    }));

    $$('[data-view]', content).forEach((button) => button.addEventListener('click', () =>
      showOrder(orders.find((o) => o.id === button.dataset.view), settings)));

    $$('[data-del]', content).forEach((button) => button.addEventListener('click', async () => {
      const order = orders.find((o) => o.id === button.dataset.del);
      const yes = await confirmDialog({ title: `Delete ${order.code}?`, message: 'The record goes for good. Sales figures change too.' });
      if (!yes) return;
      await deleteOrder(order.id);
      toastOk('Order deleted.');
      refresh();
    }));
  }

  $('[data-filter]', outlet).addEventListener('change', (event) => { filter = event.target.value; refresh(); });
  await refresh();
}

function showOrder(order, settings) {
  const wa = whatsappLink(`Hi ${order.customerName}, this is Zen G about order ${order.code}.`, { ...settings, whatsapp: order.mobile });

  const node = el('div.modal.is-open', { role: 'dialog', 'aria-modal': 'true' },
    el('div.modal__veil', { onclick: () => node.remove() }),
    el('div.modal__body', { style: { maxWidth: '620px' }, html: `
      <button class="modal__close" type="button" data-close>${icons.close}</button>
      <div class="panel" style="border:0;margin:0;background:transparent">
        <h3>${esc(order.code)}</h3>
        <p class="faint" style="font-size:.8rem">${esc(fmtDate(order.createdAt))} at ${esc(fmtTime(order.createdAt))}
          &middot; <span class="pill pill--${pillClass(order.status)}">${esc(STATUS_LABEL[order.status])}</span></p>

        <div class="panel-grid" style="margin:var(--s-4) 0">
          <div><span class="label">Customer</span><strong>${esc(order.customerName)}</strong>
            <div class="faint">${esc(order.mobile)}</div></div>
          <div><span class="label">Fulfilment</span><strong>${esc(ORDER_TYPE_LABEL[order.orderType] || order.orderType)}</strong>
            <div class="faint">${esc([order.tableName && `Table ${order.tableName}`, order.pickupTime, order.address, order.landmark, order.pincode].filter(Boolean).join(', ') || '—')}</div></div>
        </div>

        <table class="tbl" style="min-width:0">
          <tbody>
            ${(order.items || []).map((item) => `
              <tr><td>${esc(item.name)} &times; ${item.qty}
                ${item.selections?.length ? `<div class="faint" style="font-size:.72rem">${esc(item.selections.map((s) => s.label).join(', '))}</div>` : ''}
              </td><td style="text-align:right">${rupee(item.amount)}</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="totals" style="margin-top:14px"><span>Subtotal</span><span>${rupee(order.subtotal)}</span></div>
        ${order.discount ? `<div class="totals"><span>Discount ${esc(order.coupon || '')}</span><span>&minus;${rupee(order.discount)}</span></div>` : ''}
        <div class="totals grand"><span>Total</span><span>${rupee(order.total)}</span></div>

        ${order.remarks ? `<p class="notice" style="margin-top:14px"><strong>Note from the customer.</strong> ${esc(order.remarks)}</p>` : ''}

        <div class="actions" style="margin-top:var(--s-5);justify-content:flex-start">
          <a class="btn btn--ghost btn--sm" href="tel:${esc(order.mobile)}">${icons.phone} Call</a>
          ${wa ? `<a class="btn btn--ghost btn--sm" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${icons.chat} WhatsApp</a>` : ''}
        </div>
      </div>` }));

  document.body.append(node);
  $('[data-close]', node).addEventListener('click', () => node.remove());
}
