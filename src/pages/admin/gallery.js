import { $, $$, esc } from '../../core/dom.js';
import { adminShell, formDialog, confirmDialog, emptyState, statusPill } from './shell.js';
import { wireDrag } from './categories.js';
import { icons } from '../../components/icons.js';
import { listGallery, saveGalleryItem, deleteGalleryItem, reorderGallery, resolveSrc } from '../../services/galleryService.js';
import { toastOk } from '../../components/toast.js';
import { BASE } from '../../core/router.js';

const src = (shot) => {
  const resolved = resolveSrc(shot.src);
  return resolved.startsWith('assets/') ? `${BASE}/${resolved}` : resolved;
};

export async function adminGalleryPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Gallery',
    lead: 'Photos of the room, the food and the nights. Drag to reorder.',
    tools: `<button class="btn btn--gold btn--sm" type="button" data-new>${icons.plus} Add a photo</button>`
  });

  async function refresh() {
    const shots = await listGallery();

    content.innerHTML = shots.length ? `
    <div class="panel">
      <div data-sort>
        ${shots.map((shot) => `
        <div class="sortrow" draggable="true" data-id="${esc(shot.id)}">
          <span class="handle" aria-hidden="true">${icons.list}</span>
          <img class="thumb" src="${esc(src(shot))}" alt="" loading="lazy" style="width:56px;height:40px;object-fit:cover;border-radius:4px">
          <div style="flex:1">
            <strong>${esc(shot.caption || 'Untitled')}</strong>
            <div class="faint" style="font-size:.72rem">${esc(shot.tag || 'Untagged')}</div>
          </div>
          ${statusPill(shot.active !== false)}
          <div class="actions">
            <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(shot.id)}">${icons.edit}</button>
            <button class="btn btn--danger btn--sm" type="button" data-del="${esc(shot.id)}">${icons.trash}</button>
          </div>
        </div>`).join('')}
      </div>
    </div>`
    : emptyState('No photos yet', 'Upload a few and they appear on the gallery page.');

    $$('[data-edit]', content).forEach((b) => b.addEventListener('click', () =>
      openForm(shots.find((s) => s.id === b.dataset.edit))));

    $$('[data-del]', content).forEach((b) => b.addEventListener('click', async () => {
      const shot = shots.find((s) => s.id === b.dataset.del);
      const yes = await confirmDialog({ title: 'Delete this photo?', message: 'It comes off the gallery page.' });
      if (!yes) return;
      await deleteGalleryItem(shot.id);
      toastOk('Photo deleted.');
      refresh();
    }));

    wireDrag($('[data-sort]', content), async (ids) => {
      await reorderGallery(ids);
      toastOk('Order saved.');
    });
  }

  function openForm(shot = null) {
    formDialog({
      title: shot ? 'Edit photo' : 'Add a photo',
      submitLabel: shot ? 'Save changes' : 'Add photo',
      fields: [
        { name: 'src', label: 'Photo', type: 'image', value: shot ? src(shot) : '' },
        { name: 'caption', label: 'Caption', value: shot?.caption, hint: 'Shows on hover.' },
        { name: 'tag', label: 'Tag', value: shot?.tag || 'Interior',
          hint: 'Groups the filter buttons: Interior, Exterior, Food, Art, Rooftop, Nights.' },
        { name: 'active', label: 'Show on the site', type: 'checkbox', value: shot ? shot.active !== false : true }
      ],
      onSubmit: async (values) => {
        if (!values.src) throw new Error('Choose an image first.');
        await saveGalleryItem({ ...(shot || {}), ...values, id: shot?.id });
        toastOk(shot ? 'Saved.' : 'Photo added.');
        refresh();
      }
    });
  }

  $('[data-new]', outlet).addEventListener('click', () => openForm(null));
  await refresh();
}
