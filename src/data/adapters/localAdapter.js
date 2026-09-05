/**
 * LocalStorage adapter.
 *
 * Honest about what it is: data lives in ONE browser on ONE device. Editing
 * the menu on a laptop does not change what a phone sees. It exists so the
 * site runs with zero paid services on day one, and so the whole admin panel
 * can be demoed before any backend exists.
 *
 * Implements the same async interface as firebaseAdapter, so swapping is a
 * one-line change in config.js.
 */

import { config } from '../config.js';

const key = (collection) => `${config.storagePrefix}${collection}`;
const listeners = new Map();

function read(collection) {
  try {
    const raw = localStorage.getItem(key(collection));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('[local] read failed', collection, error);
    return [];
  }
}

function write(collection, rows) {
  try {
    localStorage.setItem(key(collection), JSON.stringify(rows));
  } catch (error) {
    // Quota is the realistic failure: base64 images in LocalStorage add up.
    const quota = error?.name === 'QuotaExceededError' || error?.code === 22;
    throw new Error(quota
      ? 'Browser storage is full. Delete some uploaded images, or export your data and switch to Firebase.'
      : 'Could not save to browser storage.');
  }
  emit(collection, rows);
}

function emit(collection, rows) {
  (listeners.get(collection) || []).forEach((fn) => {
    try { fn(rows); } catch (error) { console.error(error); }
  });
}

// Keep tabs in the same browser in sync.
window.addEventListener('storage', (event) => {
  if (!event.key || !event.key.startsWith(config.storagePrefix)) return;
  const collection = event.key.slice(config.storagePrefix.length);
  emit(collection, read(collection));
});

export const localAdapter = {
  name: 'local',
  shared: false,

  async init() { return true; },

  async list(collection) {
    return read(collection);
  },

  async get(collection, id) {
    return read(collection).find((row) => row.id === id) || null;
  },

  async put(collection, doc) {
    const rows = read(collection);
    const index = rows.findIndex((row) => row.id === doc.id);
    if (index >= 0) rows[index] = { ...rows[index], ...doc };
    else rows.push(doc);
    write(collection, rows);
    return doc;
  },

  async bulkPut(collection, docs) {
    const rows = read(collection);
    for (const doc of docs) {
      const index = rows.findIndex((row) => row.id === doc.id);
      if (index >= 0) rows[index] = { ...rows[index], ...doc };
      else rows.push(doc);
    }
    write(collection, rows);
    return docs;
  },

  async remove(collection, id) {
    write(collection, read(collection).filter((row) => row.id !== id));
    return true;
  },

  async replaceAll(collection, docs) {
    write(collection, docs);
    return docs;
  },

  async clear(collection) {
    localStorage.removeItem(key(collection));
    emit(collection, []);
  },

  subscribe(collection, callback) {
    if (!listeners.has(collection)) listeners.set(collection, []);
    listeners.get(collection).push(callback);
    read(collection); // warm
    callback(read(collection));
    return () => {
      const arr = listeners.get(collection) || [];
      const index = arr.indexOf(callback);
      if (index >= 0) arr.splice(index, 1);
    };
  }
};
