import { repo, COL } from '../data/repository.js';
import { uid, orderCode, rupeeText, dayKey, fmtTime } from '../core/format.js';
import { getSettings, whatsappLink } from './settingsService.js';
import { lineAmount, totals } from './cartService.js';

export const ORDER_STATUS = ['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

export const STATUS_LABEL = {
  new: 'New', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled'
};

export const ORDER_TYPE_LABEL = {
  'dine-in': 'Dine-in', takeaway: 'Takeaway', delivery: 'Home delivery'
};

/**
 * Next order code.
 *
 * Placing an order must never require write access to anything except the
 * orders collection — a customer is not signed in.
 */
function nextCode() {
  return orderCode();
}

/**
 * Build and persist an order.
 * @param {object} input customer + fulfilment details
 * @param {object} cart  from cartService.getCart()
 */
export async function createOrder(input, cart) {
  const sums = totals(cart);
  const order = {
    id: uid('ord'),
    code: nextCode(),
    customerName: input.customerName?.trim() || '',
    mobile: input.mobile?.trim() || '',
    orderType: input.orderType,
    tableId: input.tableId || '',
    tableName: input.tableName || '',
    pickupTime: input.pickupTime || '',
    address: input.address || '',
    landmark: input.landmark || '',
    pincode: input.pincode || '',
    remarks: input.remarks || '',
    items: cart.lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      qty: line.qty,
      unitPrice: line.unitPrice,
      selections: line.selections,
      amount: lineAmount(line)
    })),
    coupon: cart.coupon ? cart.coupon.code : '',
    subtotal: sums.subtotal,
    discount: sums.discount,
    total: sums.total,
    status: 'new',
    channel: 'whatsapp',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await repo.put(COL.orders, order);
  return order;
}

/**
 * The message that lands in the café's WhatsApp. Plain text only — emoji and
 * fancy formatting get mangled across Android, iOS and WhatsApp Web.
 */
export function buildWhatsappMessage(order, settings) {
  const lines = [];
  lines.push(`${(settings.restaurantName || 'ZEN G CAFE').toUpperCase()} - NEW ORDER`);
  lines.push('');
  lines.push(`Order ID: ${order.code}`);
  lines.push(`Customer: ${order.customerName}`);
  lines.push(`Mobile: ${order.mobile}`);
  lines.push(`Order Type: ${(ORDER_TYPE_LABEL[order.orderType] || order.orderType).toUpperCase()}`);

  if (order.orderType === 'dine-in' && order.tableName) lines.push(`Table: ${order.tableName}`);
  if (order.orderType === 'takeaway' && order.pickupTime) lines.push(`Pickup: ${order.pickupTime}`);
  if (order.orderType === 'delivery') {
    lines.push(`Address: ${order.address}`);
    if (order.landmark) lines.push(`Landmark: ${order.landmark}`);
    if (order.pincode) lines.push(`Pincode: ${order.pincode}`);
  }

  lines.push('');
  lines.push('ITEMS');
  order.items.forEach((it) => {
    lines.push(`${it.name} x ${it.qty} - ${rupeeText(it.amount)}`);
    const opts = (it.selections || []).map((s) => s.label).join(', ');
    if (opts) lines.push(`   (${opts})`);
  });

  lines.push('');
  lines.push(`Subtotal: ${rupeeText(order.subtotal)}`);
  if (order.discount > 0) {
    lines.push(`Discount${order.coupon ? ` (${order.coupon})` : ''}: -${rupeeText(order.discount)}`);
    lines.push(`Total: ${rupeeText(order.total)}`);
  }
  if (order.remarks) { lines.push(''); lines.push(`Remarks: ${order.remarks}`); }
  lines.push('');
  lines.push('Sent from the Zen G website. Please confirm this order.');
  return lines.join('\n');
}

/** '' when the owner has not configured a WhatsApp number yet. */
export function orderWhatsappUrl(order, settings) {
  return whatsappLink(buildWhatsappMessage(order, settings), settings);
}

/* ---------------- Admin side ---------------- */

export async function listOrders({ status = null, limit = 0 } = {}) {
  const rows = await repo.list(COL.orders);
  const sorted = rows
    .filter((o) => (status ? o.status === status : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return limit ? sorted.slice(0, limit) : sorted;
}

export const getOrder = (id) => repo.get(COL.orders, id);
export const deleteOrder = (id) => repo.remove(COL.orders, id);

export async function setStatus(id, status) {
  const order = await getOrder(id);
  if (!order) return null;
  const next = { ...order, status, updatedAt: new Date().toISOString() };
  await repo.put(COL.orders, next);
  return next;
}

export function summarise(orders) {
  const today = dayKey();
  const todays = orders.filter((o) => dayKey(new Date(o.createdAt)) === today && o.status !== 'cancelled');
  const money = (rows) => rows.reduce((sum, o) => sum + Number(o.total || 0), 0);
  return {
    todayCount: todays.length,
    todaySales: money(todays),
    pending: orders.filter((o) => ['new', 'confirmed', 'preparing'].includes(o.status)).length,
    dineIn: todays.filter((o) => o.orderType === 'dine-in').length,
    takeaway: todays.filter((o) => o.orderType === 'takeaway').length,
    delivery: todays.filter((o) => o.orderType === 'delivery').length,
    allTimeSales: money(orders.filter((o) => o.status !== 'cancelled'))
  };
}

/** Last `days` days of order counts and sales, oldest first. */
export function byDay(orders, days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const rows = orders.filter((o) => dayKey(new Date(o.createdAt)) === key && o.status !== 'cancelled');
    out.push({
      key,
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      count: rows.length,
      sales: rows.reduce((s, o) => s + Number(o.total || 0), 0)
    });
  }
  return out;
}

export function topItems(orders, limit = 6) {
  const tally = new Map();
  orders.filter((o) => o.status !== 'cancelled').forEach((order) => {
    (order.items || []).forEach((it) => {
      const row = tally.get(it.name) || { name: it.name, qty: 0, amount: 0 };
      row.qty += it.qty;
      row.amount += Number(it.amount || 0);
      tally.set(it.name, row);
    });
  });
  return [...tally.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

export function typeSplit(orders) {
  const live = orders.filter((o) => o.status !== 'cancelled');
  return [
    { key: 'dine-in',  label: 'Dine-in',  value: live.filter((o) => o.orderType === 'dine-in').length,  color: 'var(--gold)' },
    { key: 'takeaway', label: 'Takeaway', value: live.filter((o) => o.orderType === 'takeaway').length, color: 'var(--magenta)' },
    { key: 'delivery', label: 'Delivery', value: live.filter((o) => o.orderType === 'delivery').length, color: 'var(--cyan)' }
  ];
}

export const orderTime = (order) => fmtTime(order.createdAt);
