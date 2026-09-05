import { $, esc } from '../../core/dom.js';
import { adminShell, emptyState } from './shell.js';
import { rupee } from '../../core/format.js';
import { listOrders, summarise, byDay, topItems, typeSplit, STATUS_LABEL, orderTime } from '../../services/orderService.js';
import { listProducts } from '../../services/menuService.js';
import { getSettings, whatsappNumber } from '../../services/settingsService.js';
import { backendIsShared } from '../../data/repository.js';

export async function adminDashboardPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Dashboard',
    lead: 'Today at a glance, then the last seven days.',
    tools: '<a class="btn btn--ghost btn--sm" href="/admin/orders">All orders</a>'
  });

  const [orders, products, settings] = await Promise.all([listOrders(), listProducts(), getSettings()]);
  const stats = summarise(orders);
  const week = byDay(orders, 7);
  const top = topItems(orders, 6);
  const split = typeSplit(orders);
  const unavailable = products.filter((p) => p.available === false).length;

  const warnings = [
    !whatsappNumber(settings) && 'No WhatsApp number is saved, so customers cannot send orders. Add one in Settings.',
    !settings.address && 'No address is saved, so directions and the map are switched off.',
    /REPLACE_WITH/i.test(settings.instagram || '') && 'Social links still point at placeholders.',
    !backendIsShared() && 'Data lives in this browser only. Anything you change here will not appear on other devices until Firebase is connected.'
  ].filter(Boolean);

  content.innerHTML = `
  ${warnings.length ? `
  <div class="panel" style="border-color:rgba(255,138,61,.35)">
    <h3 style="margin-bottom:10px">Before you share the site</h3>
    <ul class="muted" style="margin:0;padding-left:18px;font-size:.88rem;line-height:1.9">
      ${warnings.map((w) => `<li>${esc(w)}</li>`).join('')}
    </ul>
  </div>` : ''}

  <div class="stats">
    <div class="stat stat--gold"><b>${stats.todayCount}</b><span>Orders today</span></div>
    <div class="stat stat--gold"><b>${rupee(stats.todaySales)}</b><span>Sales today</span></div>
    <div class="stat stat--mag"><b>${stats.pending}</b><span>Still open</span></div>
    <div class="stat"><b>${stats.dineIn}</b><span>Dine-in</span></div>
    <div class="stat"><b>${stats.takeaway}</b><span>Takeaway</span></div>
    <div class="stat"><b>${stats.delivery}</b><span>Delivery</span></div>
    <div class="stat stat--cy"><b>${products.length}</b><span>Dishes${unavailable ? ` (${unavailable} off)` : ''}</span></div>
  </div>

  <div class="panel-grid">
    <div class="panel">
      <h3>Orders per day</h3>
      ${barChart(week.map((d) => ({ label: d.label, value: d.count })))}
    </div>
    <div class="panel">
      <h3>Sales per day</h3>
      ${lineChart(week.map((d) => ({ label: d.label, value: d.sales })))}
      <p class="faint" style="font-size:.74rem;margin:8px 0 0">Seven-day total ${rupee(week.reduce((s, d) => s + d.sales, 0))}</p>
    </div>
  </div>

  <div class="panel-grid">
    <div class="panel">
      <h3>Top sellers</h3>
      ${top.length ? `
      <table class="tbl" style="min-width:0">
        <tbody>${top.map((row) => `
          <tr><td>${esc(row.name)}</td><td style="text-align:right">${row.qty} sold</td>
          <td style="text-align:right;color:var(--gold)">${rupee(row.amount)}</td></tr>`).join('')}
        </tbody>
      </table>` : '<p class="muted" style="font-size:.88rem">Nothing sold yet.</p>'}
    </div>
    <div class="panel">
      <h3>Order types</h3>
      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
        ${donut(split)}
        <div class="donut-legend">
          ${split.map((s) => `<span><i style="background:${s.color}"></i>${s.label} &mdash; ${s.value}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <div class="panel">
    <h3>Latest orders</h3>
    ${orders.length ? `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Order</th><th>Customer</th><th>Type</th><th>Total</th><th>Status</th><th>Time</th></tr></thead>
        <tbody>
          ${orders.slice(0, 8).map((order) => `
          <tr>
            <td><a href="/admin/orders">${esc(order.code)}</a></td>
            <td>${esc(order.customerName)}</td>
            <td>${esc(order.orderType)}${order.tableName ? ` &middot; T${esc(order.tableName)}` : ''}</td>
            <td>${rupee(order.total)}</td>
            <td><span class="pill pill--${pillClass(order.status)}">${esc(STATUS_LABEL[order.status] || order.status)}</span></td>
            <td class="faint">${esc(orderTime(order))}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : emptyState('No orders yet', 'They will appear here the moment a customer sends one from the site.')}
  </div>`;
}

const pillClass = (status) => ({
  new: 'new', confirmed: 'new', preparing: 'prep', ready: 'prep',
  completed: 'done', cancelled: 'cxl'
}[status] || 'off');

/* --- Charts drawn as plain SVG. No library, no runtime cost. --- */

function barChart(rows) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const w = 320;
  const h = 150;
  const gap = 10;
  const barW = (w - gap * (rows.length - 1)) / rows.length;
  return `<svg class="chart" viewBox="0 0 ${w} ${h + 22}" role="img" aria-label="Orders per day">
    ${[0, 0.5, 1].map((t) => `<line class="grid" x1="0" y1="${h - t * h}" x2="${w}" y2="${h - t * h}"/>`).join('')}
    ${rows.map((row, i) => {
      const barH = (row.value / max) * (h - 8);
      const x = i * (barW + gap);
      return `<rect class="bar" x="${x}" y="${h - barH}" width="${barW}" height="${Math.max(barH, 1)}" rx="2">
        <title>${esc(row.label)}: ${row.value}</title></rect>
        <text class="lbl" x="${x + barW / 2}" y="${h + 15}" text-anchor="middle">${esc(row.label)}</text>`;
    }).join('')}
  </svg>`;
}

function lineChart(rows) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const w = 320;
  const h = 150;
  const step = rows.length > 1 ? w / (rows.length - 1) : w;
  const points = rows.map((row, i) => [i * step, h - (row.value / max) * (h - 10)]);
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${w} ${h + 22}" role="img" aria-label="Sales per day">
    ${[0, 0.5, 1].map((t) => `<line class="grid" x1="0" y1="${h - t * h}" x2="${w}" y2="${h - t * h}"/>`).join('')}
    <path class="line" d="${d}"/>
    ${points.map(([x, y], i) => `<circle class="dot" cx="${x}" cy="${y}" r="3"><title>${esc(rows[i].label)}: ${rupee(rows[i].value)}</title></circle>`).join('')}
    ${rows.map((row, i) => `<text class="lbl" x="${i * step}" y="${h + 15}" text-anchor="middle">${esc(row.label)}</text>`).join('')}
  </svg>`;
}

function donut(slices) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = 46;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const rings = total === 0
    ? `<circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="16"/>`
    : slices.map((slice) => {
        const len = (slice.value / total) * c;
        const ring = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${slice.color}" stroke-width="16"
          stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"
          transform="rotate(-90 60 60)"><title>${esc(slice.label)}: ${slice.value}</title></circle>`;
        offset += len;
        return ring;
      }).join('');
  return `<svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Order type split">
    ${rings}
    <text x="60" y="65" text-anchor="middle" fill="#f4f1ec" font-size="20" font-family="Archivo,sans-serif" font-weight="700">${total}</text>
  </svg>`;
}
