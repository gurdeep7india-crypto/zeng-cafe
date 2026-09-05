import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync('/home/claude/zeng-cafe/dist/zeng-cafe-preview.html', 'utf8');
const errors = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://zeng-cafe.example/',
  virtualConsole: new (await import('jsdom')).VirtualConsole()
    .on('jsdomError', e => errors.push('jsdomError: ' + (e.detail?.message || e.message)))
    .on('error', (...a) => errors.push('console.error: ' + a.join(' ')))
});

const { window } = dom;
window.matchMedia = window.matchMedia || (q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }));
window.scrollTo = () => {};
window.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
// jsdom has no layout engine, so these browser APIs are absent
window.Element.prototype.scrollIntoView = function () {};
window.HTMLElement.prototype.scrollIntoView = function () {};
if (!window.crypto?.subtle) {
  const nodeCrypto = await import('node:crypto');
  Object.defineProperty(window, 'crypto', { value: nodeCrypto.webcrypto, configurable: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(1200);

const doc = window.document;
let pass = 0, fail = 0;
const t = (name, cond, extra='') => cond ? (pass++, console.log('  ok   ' + name))
                                        : (fail++, console.log('  FAIL ' + name + (extra ? '  ' + extra : '')));

console.log('\n— boot —');
t('app booted (no spinner left)', !doc.querySelector('#app .spinner'));
t('header mounted', !!doc.querySelector('.site-head'));
t('sticky bar mounted', !!doc.querySelector('.stickybar'));

console.log('\n— homepage —');
t('hero present', !!doc.querySelector('.hero h1'));
t('hero headline correct', /Not just a café/i.test(doc.querySelector('.hero h1')?.textContent || ''));
t('animated second line', /It's a vibe/i.test(doc.querySelector('.hero .line2')?.textContent || ''));
t('chill/connect/create triad', doc.querySelectorAll('.hero__triad i').length === 3);
t('quick actions x4', doc.querySelectorAll('.quickbar a').length === 4);
t('signature scroll section', !!doc.querySelector('.signature__stage'));
t('signature has 4 frames', doc.querySelectorAll('.signature__frame').length === 4);
t('why-zen-g has 5 blocks', doc.querySelectorAll('.why__row').length === 5);
t('signature food cards rendered', doc.querySelectorAll('#signature-food .food-card').length >= 8,
   'got ' + doc.querySelectorAll('#signature-food .food-card').length);
t('footer rendered', !!doc.querySelector('.site-foot'));
t('hero image inlined as data URI', (doc.querySelector('.hero__bg img')?.getAttribute('src')||'').startsWith('data:'));
t('logo inlined', (doc.querySelector('.brand img')?.getAttribute('src')||'').startsWith('data:'));

console.log('\n— navigation —');
const go = async (href) => {
  const link = doc.createElement('a'); link.href = href; doc.body.appendChild(link);
  link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  link.remove(); await sleep(400);
};

await go('/menu');
t('menu page rendered', doc.querySelectorAll('.menu-sect').length === 13,
  'sections: ' + doc.querySelectorAll('.menu-sect').length);
t('all 62 dishes on the menu', doc.querySelectorAll('.menu-sect .food-card').length === 62,
  'cards: ' + doc.querySelectorAll('.menu-sect .food-card').length);
t('category nav built', doc.querySelectorAll('.catnav button').length === 13);
t('hookah compliance notice shown', /18 and above/i.test(doc.body.textContent));
t('search + filters present', !!doc.querySelector('#menu-q') && doc.querySelectorAll('[data-filter]').length === 2);

console.log('\n— dish modal + cart —');
const wings = [...doc.querySelectorAll('.food-card')].find(c => /Chicken Wings/.test(c.textContent));
wings.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await sleep(350);
t('modal opened', !!doc.querySelector('.modal.is-open'));
t('modal shows the dish', /Chicken Wings/.test(doc.querySelector('.modal__body')?.textContent || ''));
t('required flavour group rendered', doc.querySelectorAll('.optgroup').length >= 2);
t('add button shows price', /269/.test(doc.querySelector('[data-total]')?.textContent || ''));

// try adding without choosing the required flavour
doc.querySelector('[data-add]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await sleep(150);
t('blocked until required option chosen', !!doc.querySelector('.modal.is-open') && doc.querySelector('.cart-pill')?.dataset.empty === 'true');

const bbq = [...doc.querySelectorAll('.optgroup input')].find(i => i.dataset.label === 'BBQ');
bbq.checked = true; bbq.dispatchEvent(new window.Event('change', { bubbles: true }));
await sleep(100);
doc.querySelector('[data-step="1"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await sleep(100);
t('quantity stepper works', doc.querySelector('[data-qty]')?.textContent === '2');
t('total tracks quantity', /538/.test(doc.querySelector('[data-total]')?.textContent || ''),
  doc.querySelector('[data-total]')?.textContent);

doc.querySelector('[data-add]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await sleep(300);
t('modal closed after adding', !doc.querySelector('.modal.is-open'));
t('cart pill shows 2', doc.querySelector('.cart-pill .count')?.textContent === '2');

console.log('\n— cart drawer —');
doc.querySelector('[data-cart]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await sleep(300);
t('cart drawer opens', !!doc.querySelector('.cart.is-open'));
t('line item listed', /Chicken Wings/.test(doc.querySelector('.cart__body')?.textContent || ''));
t('customisation shown on the line', /BBQ/.test(doc.querySelector('.cart-line__opts')?.textContent || ''));
t('brand microcopy present', /building a Zen G moment/i.test(doc.querySelector('.cart__foot')?.textContent || ''));

console.log('\n— checkout —');
doc.querySelector('[data-checkout]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await sleep(500);
t('checkout rendered', !!doc.querySelector('[data-send]'));
t('three order types offered', doc.querySelectorAll('[data-type]').length === 3);
t('warns that WhatsApp is not configured', /WhatsApp ordering is not switched on/i.test(doc.body.textContent));
t('send button disabled without a number', doc.querySelector('[data-send]')?.disabled === true);
t('order summary lists the dish', /Chicken Wings/.test(doc.querySelector('.summary')?.textContent || ''));

// delivery reveals address fields
doc.querySelector('[data-type="delivery"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await sleep(150);
t('delivery block revealed', doc.querySelector('[data-block="delivery"]')?.hidden === false);
t('dine-in block hidden', doc.querySelector('[data-block="dine-in"]')?.hidden === true);

console.log('\n— QR table flow —');
await go('/order?table=07');
await sleep(400);
t('table identified from QR', /Table/.test(doc.querySelector('.table-flag')?.textContent||'') && /07/.test(doc.querySelector('.table-flag')?.textContent||''));
t('order page shows the full menu', doc.querySelectorAll('.menu-sect').length === 13);

console.log('\n— other customer pages —');
for (const [route, probe, label] of [
  ['/gallery', () => doc.querySelectorAll('.masonry figure').length === 16, 'gallery: 16 photos'],
  ['/events', () => doc.querySelectorAll('.event-row').length === 3, 'events: 3 listings'],
  ['/about', () => /We built a room/.test(doc.body.textContent), 'about copy'],
  ['/contact', () => doc.querySelectorAll('.hours-list li').length >= 7, 'contact: opening hours'],
  ['/legal/privacy', () => /Digital Personal Data Protection/.test(doc.body.textContent), 'privacy policy'],
  ['/legal/refunds', () => /Refunds and cancellation/.test(doc.body.textContent), 'refunds policy'],
  ['/nope-not-a-page', () => /left the kitchen/i.test(doc.body.textContent), '404 page'],
]) { await go(route); t(label, probe()); }

console.log('\n— admin —');
await go('/admin');
await sleep(300);
t('first run asks to create a passcode', /Set up admin access/i.test(doc.body.textContent));
t('labelled as local demo admin', /Local demo admin/i.test(doc.body.textContent));
t('no default credential in the page', !/zeng-admin/i.test(html));

const form = doc.querySelector('[data-form]');
form.elements.secret.value = 'kolkata2026';
form.elements.confirm.value = 'kolkata2026';
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await sleep(800);
t('signs in to the dashboard', !!doc.querySelector('.adm__side'), doc.querySelector('.adm__head h1')?.textContent);
t('dashboard stat cards', doc.querySelectorAll('.stat').length === 7);
t('charts drawn', doc.querySelectorAll('svg.chart').length === 2);
t('setup checklist warns about WhatsApp', /No WhatsApp number is saved/i.test(doc.body.textContent));
t('warns data is browser-only', /this browser only/i.test(doc.body.textContent));

await go('/admin/menu'); await sleep(400);
t('admin menu lists every dish', doc.querySelectorAll('[data-row]').length === 62,
  'rows: ' + doc.querySelectorAll('[data-row]').length);
t('availability toggles present', doc.querySelectorAll('[data-avail]').length === 62);

await go('/admin/qr'); await sleep(500);
t('QR codes generated', doc.querySelectorAll('.qr-card svg').length === 12,
  'cards: ' + doc.querySelectorAll('.qr-card svg').length);
t('QR svg has real modules', (doc.querySelector('.qr-card svg path')?.getAttribute('d')||'').length > 500);
t('warns which domain codes point at', /reprint them/i.test(doc.body.textContent));

for (const [route, probe, label] of [
  ['/admin/categories', () => doc.querySelectorAll('.sortrow').length === 13, 'categories: 13 sortable rows'],
  ['/admin/customizations', () => doc.querySelectorAll('.panel').length >= 5, 'option groups listed'],
  ['/admin/orders', () => /No orders yet/.test(doc.body.textContent), 'orders empty state'],
  ['/admin/tables', () => doc.querySelectorAll('tbody tr').length === 12, 'tables: 12 rows'],
  ['/admin/gallery', () => doc.querySelectorAll('.sortrow').length === 16, 'gallery: 16 rows'],
  ['/admin/events', () => doc.querySelectorAll('tbody tr').length === 3, 'events: 3 rows'],
  ['/admin/offers', () => /ZEN10/.test(doc.body.textContent), 'offers: ZEN10'],
  ['/admin/settings', () => !!doc.querySelector('[data-importzone]'), 'settings: import/export'],
]) { await go(route); await sleep(350); t(label, probe()); }

console.log('\n— console —');
t('no runtime errors', errors.length === 0, errors.slice(0, 6).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
