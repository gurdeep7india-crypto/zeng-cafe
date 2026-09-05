/**
 * Where this order is going. Survives a refresh so a QR scan is not lost when
 * someone switches apps mid-order.
 */
import { config } from '../data/config.js';

const KEY = `${config.storagePrefix}order-context`;
const empty = { orderType: '', tableId: '', tableName: '' };

export function getContext() {
  try { return { ...empty, ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; }
  catch { return { ...empty }; }
}

export function setContext(patch) {
  const next = { ...getContext(), ...patch };
  try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  return next;
}

export function clearContext() {
  try { sessionStorage.removeItem(KEY); } catch { /* private mode */ }
}
