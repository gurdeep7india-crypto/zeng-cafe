/**
 * Cart.
 *
 * Kept in localStorage under its own key so it survives a refresh mid-order
 * (people scan a QR, get distracted, come back). It is deliberately NOT in the
 * repository — a basket belongs to one phone, not to the café's database.
 */

import { config } from '../data/config.js';
import { uid } from '../core/format.js';
import { effectivePrice } from './menuService.js';

const KEY = `${config.storagePrefix}cart`;
const watchers = new Set();

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.lines) ? parsed : { lines: [], coupon: null };
  } catch {
    return { lines: [], coupon: null };
  }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  watchers.forEach((fn) => fn(getCart()));
  document.dispatchEvent(new CustomEvent('cart:changed', { detail: getCart() }));
}

export function getCart() {
  return { lines: state.lines.map((l) => ({ ...l })), coupon: state.coupon };
}

export function onCart(fn) {
  watchers.add(fn);
  fn(getCart());
  return () => watchers.delete(fn);
}

const signature = (productId, selections) =>
  productId + '|' + selections.map((s) => `${s.groupId}:${s.optionId}`).sort().join(',');

/**
 * @param {object} product
 * @param {Array<{groupId,groupName,optionId,label,price}>} selections
 * @param {number} qty
 */
export function addLine(product, selections = [], qty = 1) {
  const sig = signature(product.id, selections);
  const existing = state.lines.find((l) => l.sig === sig);
  if (existing) existing.qty += qty;
  else {
    state.lines.push({
      id: uid('ln'),
      sig,
      productId: product.id,
      name: product.name,
      image: product.image || '',
      categoryId: product.categoryId,
      veg: product.veg !== false,
      unitPrice: effectivePrice(product),
      selections: selections.map((s) => ({ ...s })),
      qty
    });
  }
  persist();
  return getCart();
}

export function setQty(lineId, qty) {
  const line = state.lines.find((l) => l.id === lineId);
  if (!line) return getCart();
  if (qty <= 0) return removeLine(lineId);
  line.qty = qty;
  persist();
  return getCart();
}

export function removeLine(lineId) {
  state.lines = state.lines.filter((l) => l.id !== lineId);
  persist();
  return getCart();
}

export function clearCart() {
  state = { lines: [], coupon: null };
  persist();
}

export function applyCoupon(offer) {
  state.coupon = offer ? { code: offer.code, discount: offer.discount, type: offer.type || 'percent', id: offer.id } : null;
  persist();
  return getCart();
}

export const lineAmount = (line) =>
  (Number(line.unitPrice) + line.selections.reduce((s, o) => s + Number(o.price || 0), 0)) * line.qty;

export function totals(cart = getCart()) {
  const subtotal = cart.lines.reduce((sum, line) => sum + lineAmount(line), 0);
  let discount = 0;
  if (cart.coupon) {
    discount = cart.coupon.type === 'flat'
      ? Math.min(Number(cart.coupon.discount) || 0, subtotal)
      : Math.round((subtotal * (Number(cart.coupon.discount) || 0)) / 100);
  }
  return { subtotal, discount, total: Math.max(0, subtotal - discount), count: itemCount(cart) };
}

export const itemCount = (cart = getCart()) => cart.lines.reduce((n, l) => n + l.qty, 0);
