/**
 * Admin access.
 *
 * Two honest modes:
 *
 * LOCAL (default) — a passcode you choose on first run. Only a salted SHA-256
 * hash is stored, and no credential ships in the source. But everything runs in
 * the browser, so a determined visitor can read the data in devtools and clear
 * the session flag. Treat it as a lock on the office door, not a bank vault.
 * It keeps customers out of the admin screens. It is not production security.
 *
 * FIREBASE — real server-side authentication with Firebase Auth, enforced by
 * Firestore rules. Turn it on in src/data/config.js. This is what to use once
 * the site is public.
 */

import { config, usingFirebase } from '../data/config.js';
import { getSettings, saveSettings } from './settingsService.js';
import { rawAdapter, backendName, ensureSeeded } from '../data/repository.js';

const SESSION_KEY = `${config.storagePrefix}admin-session`;

export const authMode = () => (usingFirebase() && backendName() === 'firebase' ? 'firebase' : 'local');

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const randomSalt = () =>
  [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');

/** True when no local passcode exists yet — show the setup form instead of login. */
export async function needsSetup() {
  if (authMode() === 'firebase') return false;
  const settings = await getSettings(true);
  return !settings.adminPasscodeHash;
}

export async function setPasscode(passcode) {
  if (String(passcode || '').length < 6) throw new Error('Use at least 6 characters.');
  const salt = randomSalt();
  const hash = await sha256(salt + passcode);
  await saveSettings({ adminPasscodeSalt: salt, adminPasscodeHash: hash });
  startSession({ mode: 'local' });
  return true;
}

export async function signIn(identity, secret) {
  if (authMode() === 'firebase') {
    const user = await rawAdapter().signIn(identity, secret);
    startSession({ mode: 'firebase', email: user.email });
    // First staff login on a fresh project is what puts the menu into Firestore.
    await ensureSeeded();
    return user;
  }
  const settings = await getSettings(true);
  if (!settings.adminPasscodeHash) throw new Error('No passcode is set up yet.');
  const hash = await sha256(settings.adminPasscodeSalt + secret);
  if (hash !== settings.adminPasscodeHash) throw new Error('That passcode does not match.');
  startSession({ mode: 'local' });
  return { mode: 'local' };
}

export async function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  if (authMode() === 'firebase') { try { await rawAdapter().signOut(); } catch { /* noop */ } }
}

function startSession(payload) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...payload, at: Date.now() }));
}

/** Session lives for the browser tab, plus an 8-hour ceiling. */
export async function isSignedIn() {
  if (authMode() === 'firebase') {
    const user = await rawAdapter().currentUser();
    return Boolean(user);
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (Date.now() - session.at > 8 * 60 * 60 * 1000) { sessionStorage.removeItem(SESSION_KEY); return false; }
    return true;
  } catch {
    return false;
  }
}

export async function changePasscode(current, next) {
  await signIn(null, current);
  return setPasscode(next);
}
