/**
 * History-API router.
 *
 * Real paths (/menu, /admin/orders) rather than hashes, so the URLs are
 * shareable and QR-friendly. Vercel rewrites everything to index.html
 * (see vercel.json); GitHub Pages uses the 404.html redirect shim.
 */

const routes = [];
let outlet = null;
let notFound = null;
let currentCleanup = null;
let beforeEach = null;

/** BASE lets the app live in a sub-folder (e.g. GitHub Pages project sites). */
export const BASE = (window.__ZENG_BASE__ || '').replace(/\/$/, '');

export function addRoute(pattern, handler, meta = {}) {
  routes.push({ pattern, handler, meta, regex: toRegex(pattern) });
}

export function setOutlet(node) { outlet = node; }
export function setNotFound(handler) { notFound = handler; }
export function setGuard(fn) { beforeEach = fn; }

function toRegex(pattern) {
  const keys = [];
  const source = pattern
    .replace(/\/$/, '')
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:(\w+)/g, (_, key) => { keys.push(key); return '([^/]+)'; });
  return { re: new RegExp(`^${source || ''}/?$`), keys };
}

export function currentPath() {
  let path = window.location.pathname;
  if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length);
  return path.replace(/\/+$/, '') || '/';
}

export function query() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/** Navigate. `replace` swaps the history entry instead of pushing. */
export function go(path, { replace = false, scroll = true } = {}) {
  const url = BASE + (path.startsWith('/') ? path : `/${path}`);
  if (replace) window.history.replaceState({}, '', url);
  else window.history.pushState({}, '', url);
  return resolve({ scroll });
}

export async function resolve({ scroll = true } = {}) {
  const path = currentPath();
  const match = routes
    .map((route) => ({ route, m: route.regex.re.exec(path) }))
    .find((x) => x.m);

  if (beforeEach) {
    const redirect = await beforeEach(path, match?.route?.meta || {});
    if (redirect) return go(redirect, { replace: true });
  }

  if (typeof currentCleanup === 'function') { try { currentCleanup(); } catch { /* noop */ } }
  currentCleanup = null;

  const params = {};
  if (match) match.route.regex.keys.forEach((key, i) => { params[key] = decodeURIComponent(match.m[i + 1]); });

  const ctx = { path, params, query: query(), meta: match?.route?.meta || {} };
  const handler = match ? match.route.handler : notFound;
  if (!handler) return;

  outlet.setAttribute('aria-busy', 'true');
  try {
    const result = await handler(ctx);
    if (typeof result === 'function') currentCleanup = result;
  } catch (error) {
    console.error('[router]', error);
    outlet.innerHTML =
      '<div class="state" style="padding-top:22vh"><h3>This page hit a snag</h3>' +
      '<p class="muted">Reload to try again. If it keeps happening, order on WhatsApp and we will sort it out.</p></div>';
  }
  outlet.removeAttribute('aria-busy');

  if (scroll) {
    const anchor = window.location.hash;
    if (anchor) {
      const target = document.querySelector(anchor);
      if (target) { target.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  document.dispatchEvent(new CustomEvent('route:done', { detail: ctx }));
}

/** Intercept in-app link clicks so navigation stays client-side. */
export function bindLinks(root = document.body) {
  root.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || link.target === '_blank' || link.hasAttribute('download')) return;
    if (/^(https?:|mailto:|tel:|#)/i.test(href)) return;
    event.preventDefault();
    go(href);
  });
  window.addEventListener('popstate', () => resolve());
}
