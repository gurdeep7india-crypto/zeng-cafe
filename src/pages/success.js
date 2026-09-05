import { esc } from '../core/dom.js';
import { footerHTML } from '../components/chrome.js';
import { rupee } from '../core/format.js';
import { getSettings, mapsLink, whatsappLink } from '../services/settingsService.js';
import { getOrder, ORDER_TYPE_LABEL, buildWhatsappMessage, orderWhatsappUrl } from '../services/orderService.js';

export async function successPage(outlet, ctx) {
  const settings = await getSettings();
  const order = ctx.query.id ? await getOrder(ctx.query.id) : null;

  if (!order) {
    outlet.innerHTML = `
      <div class="success">
        <div>
          <h1>No order to show</h1>
          <p class="muted">This link has no order attached. Start again from the menu.</p>
          <a class="btn btn--gold" href="/menu">Open the menu</a>
        </div>
      </div>${footerHTML(settings)}`;
    return;
  }

  const wa = orderWhatsappUrl(order, settings);
  const chat = whatsappLink(`Hi Zen G, checking on order ${order.code}.`, settings);
  const maps = mapsLink(settings);

  outlet.innerHTML = `
<div class="success">
  <div>
    <p class="script gold" style="font-size:2rem">Order sent</p>
    <h1>Zen G has got you.</h1>
    <p class="oid">${esc(order.code)}</p>
    <p class="muted">${esc(ORDER_TYPE_LABEL[order.orderType] || order.orderType)}${
      order.tableName ? ` &middot; Table ${esc(order.tableName)}` : ''} &middot; ${rupee(order.total)}</p>
    <p class="muted" style="margin:0 auto;max-width:46ch">
      We confirm every order on WhatsApp before the kitchen starts. If the chat did not open,
      use the button below and send the message.
    </p>
    <div class="success__marks">
      ${wa ? `<a class="btn btn--gold" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>` : ''}
      ${chat ? `<a class="btn btn--ghost" href="${esc(chat)}" target="_blank" rel="noopener noreferrer">Chat with us</a>` : ''}
      <a class="btn btn--ghost" href="/menu">Back to menu</a>
      ${maps ? `<a class="btn btn--ghost" href="${esc(maps)}" target="_blank" rel="noopener noreferrer">Get directions</a>` : ''}
    </div>
  </div>
</div>
${footerHTML(settings)}`;
}
