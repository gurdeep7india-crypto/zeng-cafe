import { el, $, esc } from '../core/dom.js';
import { icons, brandIcons } from './icons.js';
import { onCart, itemCount } from '../services/cartService.js';
import { openCart } from './cartDrawer.js';
import { settingsNow, onSettings, mapsLink, whatsappLink, isOpenNow } from '../services/settingsService.js';
import { currentPath, go, BASE } from '../core/router.js';

const NAV = [
  ['/',        'Home',    'the front door'],
  ['/menu',    'Menu',    'everything we make'],
  ['/order',   'Order',   'dine-in, takeaway, delivery'],
  ['/gallery', 'Gallery', 'what it looks like'],
  ['/events',  'Events',  'what is on'],
  ['/about',   'About',   'who we are'],
  ['/contact', 'Contact', 'how to reach us']
];

/* ---------------- Header ---------------- */

export function mountHeader() {
  const settings = settingsNow();
  const head = el('header.site-head', { html: `
    <a class="brand" href="/" aria-label="Zen G Café, home">
      <img src="${BASE}/assets/img/logo.png" alt="" width="40" height="40">
      <span>
        <b>Zen<i>G</i> Café</b>
        <small>Chill · Connect · Create</small>
      </span>
    </a>
    <div class="head-actions">
      <button class="cart-pill" type="button" data-cart data-empty="true" aria-label="Open your order">
        ${icons.bag}<span class="count">0</span>
      </button>
      <button class="burger" type="button" data-nav aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>` });

  document.body.prepend(head);

  $('[data-cart]', head).addEventListener('click', openCart);
  $('[data-nav]', head).addEventListener('click', () => toggleNav(true));

  const pill = $('.cart-pill', head);
  onCart((cart) => {
    const n = itemCount(cart);
    pill.querySelector('.count').textContent = n;
    pill.dataset.empty = n === 0 ? 'true' : 'false';
  });

  const onScroll = () => head.classList.toggle('is-stuck', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  onSettings((s) => { $('.brand b', head).innerHTML = brandMark(s.restaurantName); });
  return head;
}

const brandMark = (name = 'Zen G Café') => {
  const safe = esc(name);
  return safe.replace(/\bG\b/, '<i>G</i>');
};

/* ---------------- Slide-over nav ---------------- */

let navNode = null;

export function toggleNav(open) {
  if (!navNode) navNode = buildNav();
  navNode.classList.toggle('is-open', open);
  document.body.classList.toggle('no-scroll', open);
  $('[data-nav]')?.setAttribute('aria-expanded', String(open));
  if (open) navNode.querySelector('.navlink')?.focus();
}

function buildNav() {
  const settings = settingsNow();
  const node = el('div.navpanel', { html: `
    <div class="navpanel__veil" data-close></div>
    <nav class="navpanel__body" aria-label="Site">
      <div class="navpanel__top">
        <span class="script gold">Where to?</span>
        <button class="modal__close" type="button" data-close aria-label="Close menu" style="position:static">${icons.close}</button>
      </div>
      ${NAV.map(([href, label, hint]) =>
        `<a class="navlink" href="${href}">${label}<em>${hint}</em></a>`).join('')}
      <div class="navpanel__foot">
        <div class="social">${socialHTML(settings)}</div>
        <p style="margin-top:16px;font-size:.8rem">${esc(settings.strapline || '')}</p>
        <a class="btn btn--quiet" href="/admin" style="padding-left:0">Staff login</a>
      </div>
    </nav>` });

  document.body.append(node);
  node.querySelectorAll('[data-close]').forEach((n) => n.addEventListener('click', () => toggleNav(false)));
  node.querySelectorAll('.navlink').forEach((a) => a.addEventListener('click', () => toggleNav(false)));
  node.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleNav(false); });
  return node;
}

export function markActiveNav() {
  const path = currentPath();
  document.querySelectorAll('.navpanel .navlink').forEach((a) => {
    if (a.getAttribute('href') === path) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/* ---------------- Social ---------------- */

const PLACEHOLDER = /REPLACE_WITH/i;

export function socialHTML(settings = settingsNow()) {
  const links = [
    ['instagram', settings.instagram, 'Instagram'],
    ['facebook', settings.facebook, 'Facebook'],
    ['youtube', settings.youtube, 'YouTube']
  ].filter(([, url]) => url && !PLACEHOLDER.test(url));

  const wa = whatsappLink('Hi Zen G!', settings);
  const items = links.map(([key, url, label]) =>
    `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${brandIcons[key]}</a>`);
  if (wa) items.push(`<a href="${esc(wa)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">${brandIcons.whatsapp}</a>`);
  return items.join('');
}

/* ---------------- Sticky mobile bar ---------------- */

export function mountStickyBar() {
  const bar = el('div.stickybar', { html: `
    <a class="btn btn--ghost" href="/menu" data-sticky-menu>Menu</a>
    <button class="btn btn--gold grow" type="button" data-sticky-cart>Order now</button>` });
  document.body.append(bar);

  const button = $('[data-sticky-cart]', bar);
  button.addEventListener('click', () => {
    if (itemCount() > 0) openCart();
    else go('/menu');
  });
  onCart((cart) => {
    const n = itemCount(cart);
    button.textContent = n ? `View order · ${n}` : 'Order now';
  });
  return bar;
}

/* ---------------- Footer ---------------- */

export function footerHTML(settings = settingsNow()) {
  const maps = mapsLink(settings);
  const status = isOpenNow(settings);
  const hours = (settings.openingHours || [])
    .map((h) => `<li><span>${esc(h.day.slice(0, 3))}</span><span>${h.closed ? 'Closed' : `${esc(h.open)} – ${esc(h.close)}`}</span></li>`)
    .join('');

  return `
<footer class="site-foot">
  <div class="shell">
    <div class="foot-grid">
      <div>
        <img src="${BASE}/assets/img/logo.png" alt="Zen G Café" width="72" height="72" style="border-radius:50%">
        <p class="script gold" style="margin:14px 0 6px">Chill. Connect. Create.</p>
        <p class="muted" style="font-size:.86rem;max-width:30ch">${esc(settings.strapline || '')}</p>
        <div class="social" style="margin-top:18px">${socialHTML(settings)}</div>
      </div>
      <div>
        <h4>Pages</h4>
        <ul>${NAV.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Hours</h4>
        <ul class="hours-list">${hours}</ul>
        <p class="${status.open ? 'gold' : 'faint'}" style="font-size:.8rem;margin-top:10px">
          ${status.open ? 'Open right now' : 'Closed right now'}
        </p>
      </div>
      <div>
        <h4>Find us</h4>
        <ul>
          <li>${settings.address ? esc(settings.address) : '<span class="faint">Address goes in Admin → Settings</span>'}</li>
          ${settings.city ? `<li>${esc(settings.city)}</li>` : ''}
          ${settings.phone ? `<li><a href="tel:${esc(settings.phone)}">${esc(settings.phone)}</a></li>` : ''}
          ${maps ? `<li><a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">Get directions</a></li>` : ''}
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} ${esc(settings.restaurantName || 'Zen G Café')}. ${esc(settings.taxNote || '')}</span>
      <span>
        <a href="/legal/privacy">Privacy</a> ·
        <a href="/legal/terms">Terms</a> ·
        <a href="/legal/refunds">Refunds &amp; cancellation</a> ·
        <a href="/legal/delivery">Delivery</a>
      </span>
    </div>
  </div>
</footer>`;
}
