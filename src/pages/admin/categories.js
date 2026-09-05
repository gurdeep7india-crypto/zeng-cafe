import { $, $$, esc } from '../../core/dom.js';
import { adminShell, formDialog, confirmDialog, emptyState, statusPill } from './shell.js';
import { icons } from '../../components/icons.js';
import { listCategories, saveCategory, deleteCategory, reorderCategories, listProducts } from '../../services/menuService.js';
import { toastOk, toastErr } from '../../components/toast.js';

export async function adminCategoriesPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Categories',
    lead: 'The sections of the menu, in the order customers scroll through them.',
    tools: `<button class="btn btn--gold btn--sm" type="button" data-new>${icons.plus} Add a category</button>`
  });

  async function refresh() {
    const [categories, products] = await Promise.all([listCategories(), listProducts()]);
    const count = (id) => products.filter((p) => p.categoryId === id).length;

    content.innerHTML = categories.length ? `
    <div class="panel">
      <h3>Drag to reorder</h3>
      <div data-sort>
        ${categories.map((category) => `
        <div class="sortrow" draggable="true" data-id="${esc(category.id)}">
          <span class="handle" aria-hidden="true">${icons.list}</span>
          <div style="flex:1">
            <strong>${esc(category.name)}</strong>
            <div class="faint" style="font-size:.74rem">${esc(category.blurb || '')}</div>
          </div>
          <span class="faint" style="font-size:.74rem">${count(category.id)} dish${count(category.id) === 1 ? '' : 'es'}</span>
          ${statusPill(category.active !== false)}
          <div class="actions">
            <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(category.id)}">${icons.edit}</button>
            <button class="btn btn--danger btn--sm" type="button" data-del="${esc(category.id)}">${icons.trash}</button>
          </div>
        </div>`).join('')}
      </div>
      <p class="faint" style="font-size:.74rem;margin:12px 0 0">Order saves as soon as you drop.</p>
    </div>`
    : emptyState('No categories yet', 'Add one, then start putting dishes in it.');

    $$('[data-edit]', content).forEach((b) => b.addEventListener('click', () =>
      openForm(categories.find((c) => c.id === b.dataset.edit))));

    $$('[data-del]', content).forEach((b) => b.addEventListener('click', async () => {
      const category = categories.find((c) => c.id === b.dataset.del);
      const dishes = count(category.id);
      if (dishes) {
        toastErr(`Move or delete the ${dishes} dish${dishes === 1 ? '' : 'es'} in ${category.name} first.`);
        return;
      }
      const yes = await confirmDialog({ title: `Delete ${category.name}?`, message: 'The section disappears from the menu.' });
      if (!yes) return;
      await deleteCategory(category.id);
      toastOk('Category deleted.');
      refresh();
    }));

    wireDrag($('[data-sort]', content), async (ids) => {
      await reorderCategories(ids);
      toastOk('Order saved.');
    });
  }

  function openForm(category = null) {
    formDialog({
      title: category ? `Edit ${category.name}` : 'Add a category',
      submitLabel: category ? 'Save changes' : 'Add category',
      fields: [
        { name: 'name', label: 'Name', value: category?.name, required: true },
        { name: 'blurb', label: 'One-line description', value: category?.blurb, full: true,
          hint: 'Shows under the heading on the menu page.' },
        { name: 'active', label: 'Show on the menu', type: 'checkbox', value: category ? category.active !== false : true }
      ],
      onSubmit: async (values) => {
        await saveCategory({ ...(category || {}), ...values, id: category?.id });
        toastOk(category ? 'Saved.' : `${values.name} added.`);
        refresh();
      }
    });
  }

  $('[data-new]', outlet).addEventListener('click', () => openForm(null));
  await refresh();
}

/** Minimal HTML5 drag reordering. */
export function wireDrag(container, onDrop) {
  if (!container) return;
  let dragged = null;

  container.addEventListener('dragstart', (event) => {
    dragged = event.target.closest('[data-id]');
    if (!dragged) return;
    dragged.classList.add('is-drag');
    event.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragend', () => {
    dragged?.classList.remove('is-drag');
    dragged = null;
    onDrop([...container.querySelectorAll('[data-id]')].map((n) => n.dataset.id));
  });

  container.addEventListener('dragover', (event) => {
    event.preventDefault();
    const over = event.target.closest('[data-id]');
    if (!over || !dragged || over === dragged) return;
    const rect = over.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    over.parentNode.insertBefore(dragged, after ? over.nextSibling : over);
  });
}
