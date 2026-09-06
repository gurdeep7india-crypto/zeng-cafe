/** Money, dates, ids, validation. */

export const rupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Plain-text rupee for the WhatsApp payload. */
export const rupeeText = (n) => `Rs.${Number(n || 0).toLocaleString('en-IN')}`;

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * ZG-0609-1V9O — date, then the time of day in base 36.
 *
 * Deliberately derived from the clock rather than a stored counter. A counter
 * would mean every customer writes to the settings document just to place an
 * order, which the Firestore rules correctly refuse. Two orders in the exact
 * same second would collide; for one café that is not a real risk, and the
 * customer name on the order tells them apart anyway.
 */
export function orderCode(date = new Date()) {
  const day = `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}`;
  const secondsToday = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return `ZG-${day}-${secondsToday.toString(36).toUpperCase().padStart(4, '0')}`;
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function fmtDate(iso, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', opts);
}

export function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Indian mobile: 10 digits starting 6-9, tolerant of +91 / spaces / dashes. */
export function normalisePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return { digits, local, valid: /^[6-9]\d{9}$/.test(local) };
}

export function isPincode(raw) {
  return /^[1-9]\d{5}$/.test(String(raw || '').trim());
}

export const slug = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function titleCase(s) {
  return String(s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
