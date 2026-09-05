import { repo, COL } from '../data/repository.js';
import { SETTINGS } from '../data/seed.js';

let cache = null;
const watchers = new Set();

export async function getSettings(force = false) {
  if (cache && !force) return cache;
  const stored = await repo.get(COL.settings, SETTINGS.id);
  cache = { ...SETTINGS, ...(stored || {}) };
  return cache;
}

/** Synchronous read for render paths. Returns defaults until the first load. */
export function settingsNow() {
  return cache || SETTINGS;
}

export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch, id: SETTINGS.id };
  await repo.put(COL.settings, next);
  cache = next;
  watchers.forEach((fn) => fn(next));
  return next;
}

export function onSettings(fn) {
  watchers.add(fn);
  getSettings().then(fn);
  return () => watchers.delete(fn);
}

/** Digits-only WhatsApp number, or '' when the owner has not set one yet. */
export function whatsappNumber(settings = settingsNow()) {
  const digits = String(settings.whatsapp || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `91${digits}` : digits;
}

export function whatsappLink(text, settings = settingsNow()) {
  const number = whatsappNumber(settings);
  if (!number) return '';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function mapsLink(settings = settingsNow()) {
  if (settings.maps) return settings.maps;
  if (settings.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.address} ${settings.city || ''}`)}`;
  }
  return '';
}

export function isOpenNow(settings = settingsNow(), now = new Date()) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = (settings.openingHours || []).find((h) => h.day === names[now.getDay()]);
  if (!today || today.closed) return { open: false, today };
  const [oh, om] = String(today.open).split(':').map(Number);
  const [ch, cm] = String(today.close).split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const from = oh * 60 + om;
  const to = ch * 60 + cm;
  const open = to <= from ? mins >= from || mins <= to : mins >= from && mins <= to;
  return { open, today };
}
