import { repo, COL } from '../data/repository.js';
import { uid } from '../core/format.js';
import { BASE } from '../core/router.js';

export async function listTables({ activeOnly = false } = {}) {
  const rows = await repo.list(COL.tables);
  return rows
    .filter((t) => (activeOnly ? t.active !== false : true))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
}

export const getTable = (id) => repo.get(COL.tables, id);

/** Tables are matched by display name, so /order?table=07 works out of the box. */
export async function findByName(name) {
  const key = String(name || '').trim().replace(/^table[\s-]*/i, '');
  if (!key) return null;
  const rows = await listTables();
  return rows.find((t) => String(t.name).toLowerCase() === key.toLowerCase())
      || rows.find((t) => Number(t.name) === Number(key))
      || null;
}

export function saveTable(table) {
  return repo.put(COL.tables, { capacity: 4, zone: '', active: true, ...table, id: table.id || uid('t') });
}

export const deleteTable = (id) => repo.remove(COL.tables, id);

/** Absolute URL a QR code should point at. */
export function tableUrl(table, origin = window.location.origin) {
  return `${origin}${BASE}/order?table=${encodeURIComponent(table.name)}`;
}
