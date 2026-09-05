import { el, $ } from '../core/dom.js';

function host() {
  let node = $('.toasts');
  if (!node) {
    node = el('div.toasts', { role: 'status', 'aria-live': 'polite' });
    document.body.append(node);
  }
  return node;
}

export function toast(message, kind = '', ms = 2600) {
  const node = el(`div.toast${kind ? `.toast--${kind}` : ''}`, {}, message);
  host().append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    setTimeout(() => node.remove(), 320);
  }, ms);
  return node;
}

export const toastOk = (m) => toast(m, 'ok');
export const toastErr = (m) => toast(m, 'err', 3600);
