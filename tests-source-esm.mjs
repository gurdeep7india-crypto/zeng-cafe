/**
 * Loads the REAL src/*.js modules through Node's native ESM loader (jsdom
 * cannot execute module scripts), with a jsdom DOM attached as globals.
 * This proves the shipped multi-file build works, independent of the bundler.
 */
import { JSDOM, VirtualConsole } from 'jsdom';

const errors = [];
const vc = new VirtualConsole().on('jsdomError', e => errors.push(e.detail?.message || e.message))
                               .on('error', (...a) => errors.push(a.join(' ')));

const dom = new JSDOM(
  `<!DOCTYPE html><html><body><main id="app"></main></body></html>`,
  { url: 'https://zeng-cafe.example/', pretendToBeVisual: true, virtualConsole: vc });

const { window } = dom;
window.matchMedia = q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){} });
window.scrollTo = () => {};
window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
window.Element.prototype.scrollIntoView = function () {};
const mem = () => { let m = {}; return { getItem:k=>k in m?m[k]:null, setItem:(k,v)=>{m[k]=String(v)}, removeItem:k=>{delete m[k]}, clear:()=>{m={}} }; };
Object.defineProperty(window, 'localStorage', { value: mem(), configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: mem(), configurable: true });
const { webcrypto } = await import('node:crypto');
Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true });

for (const k of ['navigator','location','history','localStorage','sessionStorage',
                 'HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','FormData',
                 'MutationObserver','IntersectionObserver','requestAnimationFrame','matchMedia','getComputedStyle']) {
  try { Object.defineProperty(globalThis, k, { value: window[k], configurable: true, writable: true }); } catch {}
}
Object.defineProperty(globalThis, 'window', { value: window, configurable: true });
Object.defineProperty(globalThis, 'document', { value: window.document, configurable: true });

await import('/home/claude/zeng-cafe/src/app.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(1200);

const doc = window.document;
let pass = 0, fail = 0;
const t = (n, c, x='') => c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + '  ' + x));

console.log('— real src/ modules via native ESM —');
t('app booted', !!doc.querySelector('.hero'));
t('hero headline', /Not just a café/i.test(doc.querySelector('.hero h1')?.textContent || ''));
t('header mounted', !!doc.querySelector('.site-head'));
t('footer mounted', !!doc.querySelector('.site-foot'));
t('featured dishes', doc.querySelectorAll('#signature-food .food-card').length >= 8);
t('image paths point at real files', (doc.querySelector('.hero__bg img')?.getAttribute('src')||'').includes('assets/img/hero-main.jpg'));

const go = async (href) => {
  const a = doc.createElement('a'); a.href = href; doc.body.appendChild(a);
  a.dispatchEvent(new window.MouseEvent('click', { bubbles:true, cancelable:true })); a.remove(); await sleep(450);
};

await go('/menu');
t('menu: 13 sections', doc.querySelectorAll('.menu-sect').length === 13);
t('menu: 62 dishes', doc.querySelectorAll('.food-card').length === 62);
t('real History API updates the URL', window.location.pathname === '/menu', window.location.pathname);

await go('/order?table=07');
t('QR deep link reads the query string', /07/.test(doc.querySelector('.table-flag')?.textContent || ''));
t('router parsed the search', window.location.search === '?table=07', window.location.search);

await go('/admin/orders');
t('admin guard bounces an unauthenticated user', /Set up admin access|Staff sign in/i.test(doc.body.textContent));
t('guard rewrote the URL to the login', window.location.pathname === '/admin/login', window.location.pathname);

await go('/gallery');
t('gallery renders 16 photos', doc.querySelectorAll('.masonry figure').length === 16);

t('no runtime errors', errors.length === 0, errors.slice(0,4).join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
