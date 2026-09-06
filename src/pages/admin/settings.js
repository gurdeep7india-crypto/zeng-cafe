import { $, $$, esc } from '../../core/dom.js';
import { adminShell, confirmDialog } from './shell.js';
import { icons } from '../../components/icons.js';
import { download, compressImage, readableSize } from '../../core/image.js';
import { getSettings, saveSettings, whatsappNumber } from '../../services/settingsService.js';
import { changePasscode, authMode } from '../../services/authService.js';
import { exportBundle, importBundle, factoryReset, backendName, backendIsShared, COL } from '../../data/repository.js';
import { toastOk, toastErr } from '../../components/toast.js';
import { BASE } from '../../core/router.js';

export async function adminSettingsPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Settings',
    lead: 'Contact details, hours, what you offer, and your data.'
  });

  const settings = await getSettings(true);
  const uploads = {};

  content.innerHTML = `
<form data-form>
  <div class="panel">
    <h3>The basics</h3>
    <div class="panel-grid">
      ${text('restaurantName', 'Café name', settings.restaurantName)}
      ${text('tagline', 'Tagline', settings.tagline)}
      ${text('strapline', 'Strapline', settings.strapline, 'Shown in the footer and the nav.')}
      ${text('city', 'City', settings.city)}
    </div>
  </div>

  <div class="panel">
    <h3>How customers reach you</h3>
    ${!whatsappNumber(settings) ? `
      <p class="notice notice--warn" style="margin-bottom:var(--s-4)">
        <strong>Orders cannot be sent until a WhatsApp number is saved here.</strong>
        Use the number that receives your orders, with or without +91.
      </p>` : ''}
    <div class="panel-grid">
      ${text('whatsapp', 'WhatsApp number', settings.whatsapp, '10 digits, or with the 91 country code.')}
      ${text('phone', 'Phone number', settings.phone)}
      ${text('email', 'Email', settings.email)}
      ${text('maps', 'Google Maps link', settings.maps, 'Paste the share link. Leave blank to search by address.')}
    </div>
    <label class="field" style="margin-top:var(--s-4)">
      <span class="label">Address</span>
      <textarea name="address" placeholder="Street, area, landmark">${esc(settings.address || '')}</textarea>
    </label>
  </div>

  <div class="panel">
    <h3>Social links</h3>
    <p class="faint" style="font-size:.78rem;margin-top:-8px">
      Placeholder links are hidden on the site until you replace them with real ones.
    </p>
    <div class="panel-grid">
      ${text('instagram', 'Instagram', settings.instagram)}
      ${text('facebook', 'Facebook', settings.facebook)}
      ${text('youtube', 'YouTube', settings.youtube)}
    </div>
  </div>

  <div class="panel">
    <h3>Opening hours</h3>
    <div data-hours>
      ${(settings.openingHours || []).map((h, i) => `
        <div class="sortrow" style="gap:14px">
          <strong style="min-width:6.5em">${esc(h.day)}</strong>
          <label class="switch"><input type="checkbox" data-open="${i}" ${h.closed ? '' : 'checked'}
            aria-label="${esc(h.day)} open"><i></i></label>
          <input type="time" data-from="${i}" value="${esc(h.open)}" style="max-width:130px;min-height:38px" ${h.closed ? 'disabled' : ''}>
          <span class="faint">to</span>
          <input type="time" data-to="${i}" value="${esc(h.close)}" style="max-width:130px;min-height:38px" ${h.closed ? 'disabled' : ''}>
        </div>`).join('')}
    </div>
  </div>

  <div class="panel">
    <h3>What you offer</h3>
    <div class="panel-grid">
      ${check('dineIn', 'Dine-in ordering', settings.dineIn)}
      ${check('takeaway', 'Takeaway ordering', settings.takeaway)}
      ${check('delivery', 'Home delivery', settings.delivery)}
      ${check('hookahEnabled', 'Show the hookah menu', settings.hookahEnabled)}
    </div>
    <label class="field" style="margin-top:var(--s-4)">
      <span class="label">Delivery note</span>
      <input type="text" name="deliveryRadiusNote" value="${esc(settings.deliveryRadiusNote || '')}">
    </label>
    <label class="field">
      <span class="label">Hookah compliance notice</span>
      <textarea name="hookahNotice">${esc(settings.hookahNotice || '')}</textarea>
      <span class="faint" style="font-size:.72rem">
        Shown on the hookah section and in every hookah dish popup. Keep it accurate for your licence
        and local law, and do not make health claims.
      </span>
    </label>
    <label class="field">
      <span class="label">Price note</span>
      <input type="text" name="taxNote" value="${esc(settings.taxNote || '')}">
    </label>
  </div>

  <div class="panel">
    <h3>Homepage hero</h3>
    <div class="imgpick" data-imgfield="heroImage">
      <img class="imgpick__prev" data-preview src="${esc(heroSrc(settings.heroImage))}" alt="">
      <div class="imgpick__ctrl">
        <div class="dropzone" data-drop tabindex="0" role="button">Drop a new hero image, or click to choose.</div>
        <input type="file" accept="image/*" hidden data-file>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn--ghost btn--sm" type="button" data-clear>Use the bundled photo</button>
          <span class="faint" style="font-size:.72rem" data-size></span>
        </div>
      </div>
    </div>
    <label class="field" style="margin-top:var(--s-4)">
      <span class="label">Hero video URL</span>
      <input type="text" inputmode="url" name="heroVideo" value="${esc(settings.heroVideo || '')}" placeholder="/assets/hero.mp4">
      <span class="faint" style="font-size:.72rem">
        A link to an .mp4 file. Put the file in <code>assets/</code> in your repo, then type
        <code>/assets/hero.mp4</code> here — a full https:// address works too. YouTube, Instagram
        and Google Drive share links will not work; they are pages, not video files. Keep it under
        about 10 MB, silent, and 10–20 seconds long. It plays muted on a loop behind the headline,
        with the photo showing until it loads.
      </span>
    </label>
  </div>

  <div style="display:flex;gap:10px;margin-bottom:var(--s-6)">
    <button class="btn btn--gold" type="submit">Save all settings</button>
  </div>
</form>

<div class="panel">
  <h3>Admin passcode</h3>
  ${authMode() === 'firebase'
    ? '<p class="muted" style="font-size:.88rem;margin:0">Passwords are managed in the Firebase console under Authentication.</p>'
    : `<div class="panel-grid" data-pass>
        <label class="field"><span class="label">Current passcode</span><input type="password" data-old autocomplete="current-password"></label>
        <label class="field"><span class="label">New passcode</span><input type="password" data-newpass autocomplete="new-password" minlength="6"></label>
      </div>
      <button class="btn btn--ghost btn--sm" type="button" data-changepass>Change passcode</button>`}
</div>

<div class="panel">
  <h3>Your data</h3>
  <p class="muted" style="font-size:.88rem">
    Store in use: <strong class="${backendIsShared() ? 'gold' : ''}">${backendName() === 'firebase' ? 'Firebase — shared across devices' : 'This browser only'}</strong>.
    ${backendIsShared() ? '' : 'Export regularly. Clearing browser data wipes the menu, orders and settings.'}
  </p>
  <div class="adm__tools" style="margin-bottom:var(--s-4)">
    <button class="btn btn--ghost btn--sm" type="button" data-export="all">${icons.download} Export everything</button>
    <button class="btn btn--ghost btn--sm" type="button" data-export="menu">Export menu.json</button>
    <button class="btn btn--ghost btn--sm" type="button" data-export="settings">Export settings.json</button>
    <button class="btn btn--ghost btn--sm" type="button" data-export="orders">Export orders.json</button>
  </div>
  <div class="dropzone" data-importzone tabindex="0" role="button">
    ${icons.upload} Drop an exported .json here to import it, or click to choose a file.
  </div>
  <input type="file" accept="application/json,.json" hidden data-importfile>
  <div class="actions" style="justify-content:flex-start;margin-top:var(--s-4)">
    <button class="btn btn--danger btn--sm" type="button" data-reset">Reset to the shipped menu</button>
  </div>
</div>`;

  wireHours(content);
  wireHero(content, uploads);
  wireData(content);
  wirePasscode(content);

  $('[data-form]', content).addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    ['dineIn', 'takeaway', 'delivery', 'hookahEnabled'].forEach((key) => {
      values[key] = form.elements[key].checked;
    });
    values.openingHours = readHours(content);
    Object.assign(values, uploads);

    try {
      await saveSettings(values);
      toastOk('Settings saved.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toastErr(error.message || 'Could not save.');
    }
  });
}

/* ---- helpers ---- */

const heroSrc = (value) => (value && value.startsWith('data:') ? value : `${BASE}/${value || 'assets/img/hero-main.jpg'}`);

const text = (name, label, value, hint = '') => `
  <label class="field">
    <span class="label">${esc(label)}</span>
    <input type="text" name="${name}" value="${esc(value || '')}">
    ${hint ? `<span class="faint" style="font-size:.72rem">${esc(hint)}</span>` : ''}
  </label>`;

const check = (name, label, value) => `
  <label class="field" style="display:flex;gap:12px;align-items:center">
    <span class="switch"><input type="checkbox" name="${name}" ${value !== false ? 'checked' : ''}><i></i></span>
    <span class="label" style="margin:0">${esc(label)}</span>
  </label>`;

function wireHours(content) {
  $$('[data-open]', content).forEach((toggle) => toggle.addEventListener('change', () => {
    const i = toggle.dataset.open;
    $(`[data-from="${i}"]`, content).disabled = !toggle.checked;
    $(`[data-to="${i}"]`, content).disabled = !toggle.checked;
  }));
}

function readHours(content) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map((day, i) => ({
    day,
    closed: !$(`[data-open="${i}"]`, content).checked,
    open: $(`[data-from="${i}"]`, content).value || '12:00',
    close: $(`[data-to="${i}"]`, content).value || '23:00'
  }));
}

function wireHero(content, uploads) {
  const wrapper = $('[data-imgfield="heroImage"]', content);
  const input = $('[data-file]', wrapper);
  const drop = $('[data-drop]', wrapper);
  const preview = $('[data-preview]', wrapper);
  const size = $('[data-size]', wrapper);

  const take = async (file) => {
    if (!file) return;
    try {
      const { image, bytes } = await compressImage(file, { maxEdge: 1920, quality: 0.84 });
      uploads.heroImage = image;
      uploads.heroImageMobile = image;
      preview.src = image;
      size.textContent = `Saved at ${readableSize(bytes)}`;
    } catch (error) { toastErr(error.message); }
  };

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => take(input.files[0]));
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => take(e.dataTransfer.files[0]));

  $('[data-clear]', wrapper).addEventListener('click', () => {
    uploads.heroImage = 'assets/img/hero-main.jpg';
    uploads.heroImageMobile = 'assets/img/hero-mobile.jpg';
    preview.src = `${BASE}/assets/img/hero-main.jpg`;
    size.textContent = 'Back to the bundled photo';
  });
}

function wireData(content) {
  const sets = {
    all: Object.values(COL),
    menu: [COL.categories, COL.products, COL.customizations],
    settings: [COL.settings],
    orders: [COL.orders]
  };

  $$('[data-export]', content).forEach((button) => button.addEventListener('click', async () => {
    const key = button.dataset.export;
    const bundle = await exportBundle(sets[key]);
    download(`zeng-${key}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(bundle, null, 2));
    toastOk('Exported.');
  }));

  const zone = $('[data-importzone]', content);
  const file = $('[data-importfile]', content);

  const take = async (chosen) => {
    if (!chosen) return;
    try {
      const bundle = JSON.parse(await chosen.text());
      const yes = await confirmDialog({
        title: 'Import this file?',
        message: 'Collections in the file replace what is here now. Export first if you want a backup.',
        confirmLabel: 'Import', danger: false
      });
      if (!yes) return;
      const names = await importBundle(bundle);
      toastOk(`Imported ${names.join(', ')}.`);
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      toastErr(error.message || 'That file could not be read.');
    }
  };

  zone.addEventListener('click', () => file.click());
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
  file.addEventListener('change', () => take(file.files[0]));
  ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove('is-over'); }));
  zone.addEventListener('drop', (e) => take(e.dataTransfer.files[0]));

  $('[data-reset]', content)?.addEventListener('click', async () => {
    const yes = await confirmDialog({
      title: 'Reset everything?',
      message: 'Menu, orders, tables, gallery and settings go back to what shipped. This cannot be undone.',
      confirmLabel: 'Reset it all'
    });
    if (!yes) return;
    await factoryReset();
    toastOk('Reset done.');
    setTimeout(() => window.location.reload(), 600);
  });
}

function wirePasscode(content) {
  $('[data-changepass]', content)?.addEventListener('click', async () => {
    const current = $('[data-old]', content).value;
    const next = $('[data-newpass]', content).value;
    try {
      await changePasscode(current, next);
      $('[data-old]', content).value = '';
      $('[data-newpass]', content).value = '';
      toastOk('Passcode changed.');
    } catch (error) {
      toastErr(error.message || 'Could not change the passcode.');
    }
  });
}
