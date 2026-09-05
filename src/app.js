/**
 * Zen G Café — application entry point.
 *
 * Registers every route, mounts the shared chrome, and boots the data layer.
 * Customer routes and admin routes live in the same bundle but share nothing
 * except the service layer.
 */

import { $ } from './core/dom.js';
import { addRoute, setOutlet, setNotFound, setGuard, bindLinks, resolve, currentPath } from './core/router.js';
import { initData } from './data/repository.js';
import { getSettings } from './services/settingsService.js';
import { isSignedIn } from './services/authService.js';
import { mountHeader, mountStickyBar, markActiveNav } from './components/chrome.js';
import { bindFoodCards } from './components/foodModal.js';

/* --- Customer pages --- */
import { homePage } from './pages/home.js';
import { menuPage } from './pages/menu.js';
import { orderPage } from './pages/order.js';
import { cartPage } from './pages/cart.js';
import { checkoutPage } from './pages/checkout.js';
import { successPage } from './pages/success.js';
import { galleryPage } from './pages/gallery.js';
import { eventsPage } from './pages/events.js';
import { aboutPage } from './pages/about.js';
import { contactPage } from './pages/contact.js';
import { legalPage } from './pages/legal.js';
import { notFoundPage } from './pages/notFound.js';

/* --- Admin pages --- */
import { adminLoginPage } from './pages/admin/login.js';
import { adminDashboardPage } from './pages/admin/dashboard.js';
import { adminMenuPage } from './pages/admin/menu.js';
import { adminCategoriesPage } from './pages/admin/categories.js';
import { adminCustomizationsPage } from './pages/admin/customizations.js';
import { adminOrdersPage } from './pages/admin/orders.js';
import { adminTablesPage } from './pages/admin/tables.js';
import { adminQrPage } from './pages/admin/qr.js';
import { adminGalleryPage } from './pages/admin/gallery.js';
import { adminEventsPage } from './pages/admin/events.js';
import { adminOffersPage } from './pages/admin/offers.js';
import { adminSettingsPage } from './pages/admin/settings.js';

const outlet = $('#app');
setOutlet(outlet);

/* ---------------- Routes ---------------- */

const customer = (handler) => (ctx) => handler(outlet, ctx);

addRoute('/',              customer(homePage),     { title: 'Zen G Café Kolkata | Chill. Connect. Create.' });
addRoute('/menu',          customer(menuPage),     { title: 'Menu | Zen G Café Kolkata' });
addRoute('/order',         customer(orderPage),    { title: 'Order | Zen G Café Kolkata' });
addRoute('/cart',          customer(cartPage),     { title: 'Your order | Zen G Café' });
addRoute('/checkout',      customer(checkoutPage), { title: 'Checkout | Zen G Café' });
addRoute('/order-success', customer(successPage),  { title: 'Order sent | Zen G Café' });
addRoute('/gallery',       customer(galleryPage),  { title: 'Gallery | Zen G Café Kolkata' });
addRoute('/events',        customer(eventsPage),   { title: "What's on | Zen G Café Kolkata" });
addRoute('/about',         customer(aboutPage),    { title: 'About | Zen G Café Kolkata' });
addRoute('/contact',       customer(contactPage),  { title: 'Find us | Zen G Café Kolkata' });
addRoute('/legal/:doc',    customer(legalPage),    { title: 'Zen G Café' });

addRoute('/admin',               () => adminLoginPage(outlet),           { admin: 'public' });
addRoute('/admin/login',         () => adminLoginPage(outlet),           { admin: 'public' });
addRoute('/admin/dashboard',     () => adminDashboardPage(outlet),       { admin: true });
addRoute('/admin/menu',          () => adminMenuPage(outlet),            { admin: true });
addRoute('/admin/categories',    () => adminCategoriesPage(outlet),      { admin: true });
addRoute('/admin/customizations',() => adminCustomizationsPage(outlet),  { admin: true });
addRoute('/admin/orders',        () => adminOrdersPage(outlet),          { admin: true });
addRoute('/admin/tables',        () => adminTablesPage(outlet),          { admin: true });
addRoute('/admin/qr',            () => adminQrPage(outlet),              { admin: true });
addRoute('/admin/gallery',       () => adminGalleryPage(outlet),         { admin: true });
addRoute('/admin/events',        () => adminEventsPage(outlet),          { admin: true });
addRoute('/admin/offers',        () => adminOffersPage(outlet),          { admin: true });
addRoute('/admin/settings',      () => adminSettingsPage(outlet),        { admin: true });

setNotFound(customer(notFoundPage));

/* ---------------- Guard ---------------- */

setGuard(async (path, meta) => {
  const admin = path.startsWith('/admin');
  document.body.classList.toggle('admin-body', admin);
  document.documentElement.classList.toggle('is-admin', admin);

  // Customer chrome is irrelevant inside the admin panel and vice versa.
  document.querySelector('.site-head')?.toggleAttribute('hidden', admin);
  document.querySelector('.stickybar')?.toggleAttribute('hidden', admin);

  if (meta.admin === true && !(await isSignedIn())) return '/admin/login';
  if (path === '/admin' || path === '/admin/login') {
    if (await isSignedIn()) return '/admin/dashboard';
  }
  return null;
});

/* ---------------- Boot ---------------- */

async function boot() {
  await initData();
  await getSettings();

  mountHeader();
  mountStickyBar();
  bindFoodCards(document.body);
  bindLinks();

  await resolve({ scroll: false });

  document.addEventListener('route:done', (event) => {
    const { title } = event.detail.meta;
    if (title) document.title = title;
    markActiveNav();
  });

  document.documentElement.classList.add('is-ready');
}

boot().catch((error) => {
  console.error('[zeng] boot failed', error);
  outlet.innerHTML = `
    <div class="state" style="padding-top:22vh">
      <h3>The site could not start</h3>
      <p class="muted">Reload the page. If it keeps happening, your browser may be blocking local storage.</p>
      <button class="btn btn--gold" type="button" onclick="location.reload()">Reload</button>
    </div>`;
});
