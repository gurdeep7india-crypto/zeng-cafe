/**
 * Repository — the single seam between the app and whatever stores its data.
 *
 * Services talk to this. This talks to an adapter. Nothing else imports an
 * adapter directly, which is why moving from LocalStorage to Firestore is a
 * config change rather than a rewrite.
 */

import { config, usingFirebase } from './config.js';
import { localAdapter } from './adapters/localAdapter.js';
import { CATEGORIES, PRODUCTS, CUSTOMIZATIONS, TABLES, GALLERY, EVENTS, OFFERS, SETTINGS } from './seed.js';

export const COL = {
  categories: 'categories',
  products: 'products',
  customizations: 'customizations',
  orders: 'orders',
  tables: 'tables',
  gallery: 'gallery',
  events: 'events',
  offers: 'offers',
  settings: 'settings'
};

let adapter = localAdapter;
let ready = null;

export function backendName() { return adapter.name; }
export function backendIsShared() { return Boolean(adapter.shared); }
export function rawAdapter() { return adapter; }

async function pickAdapter() {
  if (!usingFirebase()) return localAdapter;
  try {
    const { firebaseAdapter } = await import('./adapters/firebaseAdapter.js');
    await firebaseAdapter.init();
    return firebaseAdapter;
  } catch (error) {
    console.error('[repository] Firebase unavailable, falling back to local storage', error);
    return localAdapter;
  }
}

/** Call once at boot. Idempotent. */
export function initData() {
  if (ready) return ready;
  ready = (async () => {
    adapter = await pickAdapter();
    await adapter.init();
    await seedIfEmpty();
    return adapter;
  })();
  return ready;
}

async function seedIfEmpty() {
  const existing = await adapter.list(COL.products);
  if (existing.length) {
    // Settings can be missing even when products exist (partial imports).
    const settings = await adapter.get(COL.settings, SETTINGS.id);
    if (!settings) await adapter.put(COL.settings, SETTINGS);
    return;
  }
  await adapter.bulkPut(COL.categories, CATEGORIES);
  await adapter.bulkPut(COL.products, PRODUCTS);
  await adapter.bulkPut(COL.customizations, CUSTOMIZATIONS);
  await adapter.bulkPut(COL.tables, TABLES);
  await adapter.bulkPut(COL.gallery, GALLERY);
  await adapter.bulkPut(COL.events, EVENTS);
  await adapter.bulkPut(COL.offers, OFFERS);
  await adapter.put(COL.settings, SETTINGS);
}

/* --- Thin pass-through API --------------------------------------------- */
export const repo = {
  list:       (c)      => initData().then(() => adapter.list(c)),
  get:        (c, id)  => initData().then(() => adapter.get(c, id)),
  put:        (c, doc) => initData().then(() => adapter.put(c, doc)),
  bulkPut:    (c, docs)=> initData().then(() => adapter.bulkPut(c, docs)),
  remove:     (c, id)  => initData().then(() => adapter.remove(c, id)),
  replaceAll: (c, docs)=> initData().then(() => adapter.replaceAll(c, docs)),
  clear:      (c)      => initData().then(() => adapter.clear(c)),
  subscribe:  (c, cb)  => { let off = () => {}; initData().then(() => { off = adapter.subscribe(c, cb); }); return () => off(); }
};

/* --- Portability -------------------------------------------------------- */

export async function exportBundle(collections = Object.values(COL)) {
  await initData();
  const bundle = { _meta: { app: 'zeng-cafe', version: 1, exportedAt: new Date().toISOString(), backend: adapter.name } };
  for (const name of collections) bundle[name] = await adapter.list(name);
  return bundle;
}

export async function importBundle(bundle, { merge = false } = {}) {
  await initData();
  const names = Object.keys(bundle).filter((k) => k !== '_meta' && Array.isArray(bundle[k]));
  if (!names.length) throw new Error('That file has no Zen G collections in it.');
  for (const name of names) {
    if (merge) await adapter.bulkPut(name, bundle[name]);
    else await adapter.replaceAll(name, bundle[name]);
  }
  return names;
}

/** Wipe everything and lay the shipped menu back down. */
export async function factoryReset() {
  await initData();
  for (const name of Object.values(COL)) await adapter.clear(name);
  await seedIfEmpty();
}
