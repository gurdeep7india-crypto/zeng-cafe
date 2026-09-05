import { el, $, $$, esc, fill, trapFocus } from '../../core/dom.js';
import { icons } from '../../components/icons.js';
import { signOut } from '../../services/authService.js';
import { settingsNow } from '../../services/settingsService.js';
import { backendName, backendIsShared } from '../../data/repository.js';
import { go, currentPath, BASE } from '../../core/router.js';
import { compressImage, readableSize } from '../../core/image.js';
import { toastErr } from '../../components/toast.js';

const NAV = [
  ['Overview', [
    ['/admin/dashboard', 'Dashboard', 'chart'],
    ['/admin/orders', 'Orders', 'list']
  ]],
  ['The menu', [
    ['/admin/menu', 'Dishes', 'fork'],
    ['/admin/categories', 'Categories', 'grid'],
    ['/admin/customizations', 'Options', 'sparkle'],
    ['/admin/offers', 'Offers', 'tag']
  ]],
  ['The room', [
    ['/admin/tables', 'Tables', 'chair'],
    ['/admin/qr', 'QR codes', 'qr'],
    ['/admin/gallery', 'Gallery', 'image'],
    ['/admin/events', 'Events', 'calendar']
  ]],
  ['Setup', [
    ['/admin/settings', 'Settings', 'gear']
  ]]
];

/**
 * Renders the admin chrome and returns the main content node for a page to
 * fill. Every admin page calls this first.
 */
export function adminShell(outlet, { title, lead = '', tools = '' } = {}) {
  document.body.classList.add('admin-body');
  const settings = settingsNow();
  const path = currentPath();

  outlet.innerHTML = `
<div class="adm">
  <aside class="adm__side">
    <a class="adm__brand" href="/">
      <img src="${BASE}/assets/img/logo.png" alt="" width="34" height="34">
      <span><b>${esc(settings.restaurantName || 'Zen G')}</b><small>Admin</small></span>
    </a>
    <nav class="adm__nav" aria-label="Admin sections">
      ${NAV.map(([group, links]) => `
        <div class="adm__group-label">${group}</div>
        ${links.map(([href, label, icon]) =>
          `<a href="${href}" class="${path === href ? 'is-on' : ''}">${icons[icon]}<span>${label}</span></a>`).join('')}
      `).join('')}
    </nav>
    <div style="margin-top:auto;padding:var(--s-5) var(--s-5) 0">
      <p class="faint" style="font-size:.68rem;line-height:1.5">
        Data store: <strong class="${backendIsShared() ? 'gold' : ''}">${backendName() === 'firebase' ? 'Firebase (shared)' : 'This browser only'}</strong>
      </p>
      <button class="btn btn--quiet" type="button" data-signout style="padding-left:0">${icons.logout} Sign out</button>
    </div>
  </aside>

  <main class="adm__main">
    <div class="adm__head">
      <div><h1>${esc(title)}</h1>${lead ? `<p>${esc(lead)}</p>` : ''}</div>
      <div class="adm__tools">${tools}</div>
    </div>
    <div data-adm-content></div>
  </main>
</div>`;

  $('[data-signout]', outlet).addEventListener('click', async () => {
    await signOut();
    go('/admin/login');
  });

  return $('[data-adm-content]', outlet);
}

/* ---------------- Shared dialog ---------------- */

let dialogNode = null;

function dialogRoot() {
  if (dialogNode) return dialogNode;
  dialogNode = el('div.modal', { role: 'dialog', 'aria-modal': 'true' },
    el('div.modal__veil', { onclick: closeDialog }),
    el('div.modal__body', { style: { maxWidth: '680px' } }));
  document.body.append(dialogNode);
  return dialogNode;
}

export function closeDialog() {
  dialogNode?.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
}

/**
 * Opens a form built from a field spec and resolves with the values, or null
 * when cancelled.
 *
 * fields: [{ name, label, type, value, options, hint, required, full }]
 * types: text | number | textarea | select | checkbox | image | color | date | time | tags
 */
export function formDialog({ title, fields, submitLabel = 'Save', onSubmit }) {
  const node = dialogRoot();
  const body = $('.modal__body', node);

  fill(body, el('div', { html: `
    <button class="modal__close" type="button" data-close aria-label="Close">${icons.close}</button>
    <form class="panel" style="border:0;margin:0;background:transparent" novalidate>
      <h3 style="margin-bottom:var(--s-5)">${esc(title)}</h3>
      <div class="panel-grid">${fields.map(fieldHTML).join('')}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:var(--s-5)">
        <button class="btn btn--ghost" type="button" data-close>Cancel</button>
        <button class="btn btn--gold" type="submit">${esc(submitLabel)}</button>
      </div>
    </form>` }));

  const form = $('form', body);
  const uploads = {};

  $$('[data-close]', body).forEach((b) => b.addEventListener('click', closeDialog));
  wireImageFields(form, uploads);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    fields.filter((f) => f.type === 'checkbox').forEach((f) => { values[f.name] = form.elements[f.name].checked; });
    Object.assign(values, uploads);

    const missing = fields.find((f) => f.required && !String(values[f.name] ?? '').trim());
    if (missing) { toastErr(`${missing.label} is needed.`); form.elements[missing.name]?.focus(); return; }

    try {
      await onSubmit(values);
      closeDialog();
    } catch (error) {
      toastErr(error.message || 'That did not save.');
    }
  });

  node.classList.add('is-open');
  document.body.classList.add('no-scroll');
  trapFocus(body, closeDialog);
  form.querySelector('input, select, textarea')?.focus();
}

function fieldHTML(field) {
  const id = `f_${field.name}`;
  const common = `id="${id}" name="${esc(field.name)}"`;
  const label = `<span class="label">${esc(field.label)}${field.required ? ' <span class="req">*</span>' : ''}</span>`;
  const hint = field.hint ? `<span class="faint" style="font-size:.72rem">${esc(field.hint)}</span>` : '';
  const wrap = (inner) => `<label class="field" style="${field.full ? 'grid-column:1/-1' : ''}">${label}${inner}${hint}</label>`;

  switch (field.type) {
    case 'textarea':
      return wrap(`<textarea ${common} placeholder="${esc(field.placeholder || '')}">${esc(field.value || '')}</textarea>`);
    case 'select':
      return wrap(`<select ${common}>${(field.options || []).map((o) => {
        const [value, text] = Array.isArray(o) ? o : [o, o];
        return `<option value="${esc(value)}" ${String(field.value) === String(value) ? 'selected' : ''}>${esc(text)}</option>`;
      }).join('')}</select>`);
    case 'checkbox':
      return `<label class="field" style="display:flex;gap:12px;align-items:center;${field.full ? 'grid-column:1/-1' : ''}">
        <span class="switch"><input type="checkbox" ${common} ${field.value ? 'checked' : ''}><i></i></span>
        <span><span class="label" style="margin:0">${esc(field.label)}</span>${hint}</span></label>`;
    case 'image':
      return `<div class="field" style="grid-column:1/-1">
        ${label}
        <div class="imgpick" data-imgfield="${esc(field.name)}">
          <img class="imgpick__prev" data-preview src="${esc(field.value || '')}" alt="">
          <div class="imgpick__ctrl">
            <div class="dropzone" data-drop tabindex="0" role="button">
              Drop an image here, or click to choose. It is resized and compressed before saving.
            </div>
            <input type="file" accept="image/*" hidden data-file>
            <div style="display:flex;gap:8px;align-items:center">
              <button class="btn btn--ghost btn--sm" type="button" data-clear>Remove image</button>
              <span class="faint" style="font-size:.72rem" data-size></span>
            </div>
          </div>
        </div>${hint}</div>`;
    case 'number':
      return wrap(`<input type="number" ${common} value="${esc(field.value ?? '')}" min="${field.min ?? 0}" step="${field.step ?? 1}" placeholder="${esc(field.placeholder || '')}">`);
    default:
      return wrap(`<input type="${field.type || 'text'}" ${common} value="${esc(field.value ?? '')}" placeholder="${esc(field.placeholder || '')}" autocomplete="off">`);
  }
}

function wireImageFields(form, uploads) {
  $$('[data-imgfield]', form).forEach((wrapper) => {
    const name = wrapper.dataset.imgfield;
    const input = $('[data-file]', wrapper);
    const drop = $('[data-drop]', wrapper);
    const preview = $('[data-preview]', wrapper);
    const size = $('[data-size]', wrapper);

    const take = async (file) => {
      if (!file) return;
      try {
        const { image, thumbnail, bytes } = await compressImage(file);
        uploads[name] = image;
        uploads[`${name}Thumb`] = thumbnail;
        preview.src = image;
        size.textContent = `Saved at ${readableSize(bytes)}`;
      } catch (error) {
        toastErr(error.message);
      }
    };

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => take(input.files[0]));

    ['dragenter', 'dragover'].forEach((type) =>
      drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((type) =>
      drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => take(e.dataTransfer.files[0]));

    $('[data-clear]', wrapper).addEventListener('click', () => {
      uploads[name] = '';
      uploads[`${name}Thumb`] = '';
      preview.removeAttribute('src');
      size.textContent = 'Using the generated placeholder';
    });
  });
}

/** Promise-based confirm, styled like the rest of the panel. */
export function confirmDialog({ title, message, confirmLabel = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    const node = dialogRoot();
    const body = $('.modal__body', node);
    fill(body, el('div', { html: `
      <div class="panel" style="border:0;margin:0;background:transparent">
        <h3>${esc(title)}</h3>
        <p class="muted">${esc(message)}</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:var(--s-5)">
          <button class="btn btn--ghost" type="button" data-no>Keep it</button>
          <button class="btn ${danger ? 'btn--danger' : 'btn--gold'}" type="button" data-yes>${esc(confirmLabel)}</button>
        </div>
      </div>` }));
    $('[data-no]', body).addEventListener('click', () => { closeDialog(); resolve(false); });
    $('[data-yes]', body).addEventListener('click', () => { closeDialog(); resolve(true); });
    node.classList.add('is-open');
    document.body.classList.add('no-scroll');
    $('[data-no]', body).focus();
  });
}

export const statusPill = (active) =>
  `<span class="pill ${active ? 'pill--on' : 'pill--off'}">${active ? 'Live' : 'Hidden'}</span>`;

export const emptyState = (heading, note, actionHTML = '') =>
  `<div class="state"><h3>${esc(heading)}</h3><p class="muted">${esc(note)}</p>${actionHTML}</div>`;
