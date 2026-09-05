/**
 * Minimal DOM helpers. No framework — keeps the bundle at zero dependencies
 * and the whole site deployable as static files.
 */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escape untrusted text before it goes into innerHTML. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a value for use inside an HTML attribute. */
export const attr = esc;

/**
 * Create an element.
 * el('div.card', { onclick: fn }, 'text', childNode)
 */
export function el(spec, props = {}, ...children) {
  const [tagPart, ...classes] = spec.split('.');
  const [tag, id] = tagPart.split('#');
  const node = document.createElement(tag || 'div');
  if (id) node.id = id;
  if (classes.length) node.className = classes.join(' ');

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className += ` ${value}`;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node && key !== 'list' && typeof value !== 'object') {
      try { node[key] = value; } catch { node.setAttribute(key, value); }
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }

  appendAll(node, children);
  return node;
}

function appendAll(node, children) {
  for (const child of children.flat(4)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Replace a node's content. */
export function fill(node, ...children) {
  node.innerHTML = '';
  appendAll(node, children);
  return node;
}

/** Build a node from an HTML string. */
export function frag(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content;
}

/** Event delegation: on(root, 'click', '.btn', handler) */
export function on(root, type, selector, handler) {
  root.addEventListener(type, (event) => {
    const match = event.target.closest(selector);
    if (match && root.contains(match)) handler(event, match);
  });
}

/** Trap Tab focus inside a container (modals, drawers). */
export function trapFocus(container, onEscape) {
  const selector = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  function handle(event) {
    if (event.key === 'Escape') { onEscape?.(); return; }
    if (event.key !== 'Tab') return;
    const items = $$(selector, container).filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', handle);
  return () => container.removeEventListener('keydown', handle);
}

/** Debounce. */
export function debounce(fn, wait = 220) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
