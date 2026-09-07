import { $, $$, esc } from '../../core/dom.js';
import { adminShell, formDialog, confirmDialog, emptyState } from './shell.js';
import { rupee } from '../../core/format.js';
import { imageFor } from '../../core/placeholder.js';
import { icons } from '../../components/icons.js';
import {
  listProducts, saveProduct, deleteProduct, setProductFlag,
  listCategories, listCustomizations, effectivePrice
} from '../../services/menuService.js';
import { toastOk, toastErr } from '../../components/toast.js';

export async function adminMenuPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Dishes',
    lead: 'Everything on the menu. Prices, photos, availability.',
    tools: `<input type="search" data-search placeholder="Filter dishes…" style="min-height:38px;max-width:220px">
            <button class="btn btn--ghost btn--sm" type="button" data-nophoto>${icons.image} Missing photos</button>
            <button class="btn btn--gold btn--sm" type="button" data-new>${icons.plus} Add a dish</button>`
  });

  let categories = [];
  let groups = [];

  async function refresh() {
    const [products, cats, custom] = await Promise.all([
      listProducts(), listCategories(), listCustomizations()
    ]);
    categories = cats;
    groups = custom;

    const byCategory = cats
      .map((c) => ({ category: c, items: products.filter((p) => p.categoryId === c.id) }))
      .filter((g) => g.items.length);

    const orphans = products.filter((p) => !cats.some((c) => c.id === p.categoryId));
    if (orphans.length) byCategory.push({ category: { id: '', name: 'Uncategorised' }, items: orphans });

    content.innerHTML = products.length ? byCategory.map((group) => `
      <div class="panel" data-group>
        <h3>${esc(group.category.name)} <span class="faint" style="font-size:.72rem">${group.items.length}</span></h3>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th></th><th>Dish</th><th>Price</th><th>Diet</th><th>Flags</th><th>Available</th><th></th></tr></thead>
            <tbody>
              ${group.items.map((product) => `
              <tr data-row data-name="${esc(product.name.toLowerCase())}" data-photo="${product.image ? 'yes' : 'no'}">
                <td>
                  <img class="thumb" src="${esc(product.thumbnail || imageFor(product))}" alt="" loading="lazy">
                  ${product.image ? '' : '<div class="faint" style="font-size:.6rem;text-align:center;margin-top:3px">no photo</div>'}
                </td>
                <td>
                  <strong>${esc(product.name)}</strong>
                  <div class="faint" style="font-size:.74rem;max-width:34ch">${esc(product.description || '')}</div>
                </td>
                <td>${effectivePrice(product) < Number(product.price)
                      ? `<s class="faint">${rupee(product.price)}</s> <span class="gold">${rupee(effectivePrice(product))}</span>`
                      : rupee(product.price)}</td>
                <td><span class="pill">${product.veg === false ? 'Non-veg' : 'Veg'}</span></td>
                <td class="faint" style="font-size:.72rem">
                  ${product.popular ? 'Bestseller' : ''}${product.popular && product.featured ? ' &middot; ' : ''}${product.featured ? 'Signature' : ''}
                </td>
                <td>
                  <label class="switch"><input type="checkbox" data-avail="${esc(product.id)}"
                    ${product.available !== false ? 'checked' : ''}
                    aria-label="${esc(product.name)} available"><i></i></label>
                </td>
                <td><div class="actions">
                  <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(product.id)}"
                          title="Edit ${esc(product.name)}, including its photo">${icons.edit} Edit</button>
                  <button class="btn btn--danger btn--sm" type="button" data-del="${esc(product.id)}"
                          title="Delete ${esc(product.name)}">${icons.trash}</button>
                </div></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`).join('')
      : emptyState('The menu is empty', 'Add your first dish and it will show on the site straight away.');

    wire(products);
    applyFilters();
  }

  function wire(products) {
    $$('[data-avail]', content).forEach((toggle) => toggle.addEventListener('change', async () => {
      await setProductFlag(toggle.dataset.avail, 'available', toggle.checked);
      toastOk(toggle.checked ? 'Back on the menu.' : 'Marked unavailable.');
    }));

    $$('[data-edit]', content).forEach((button) => button.addEventListener('click', () => {
      openForm(products.find((p) => p.id === button.dataset.edit));
    }));

    $$('[data-del]', content).forEach((button) => button.addEventListener('click', async () => {
      const product = products.find((p) => p.id === button.dataset.del);
      const yes = await confirmDialog({
        title: `Delete ${product.name}?`,
        message: 'It comes off the menu immediately. Past orders keep their record of it.'
      });
      if (!yes) return;
      await deleteProduct(product.id);
      toastOk(`${product.name} deleted.`);
      refresh();
    }));
  }

  function openForm(product = null) {
    formDialog({
      title: product ? `Edit ${product.name}` : 'Add a dish',
      submitLabel: product ? 'Save changes' : 'Add to menu',
      fields: [
        { name: 'name', label: 'Dish name', value: product?.name, required: true },
        { name: 'categoryId', label: 'Category', type: 'select', value: product?.categoryId,
          options: categories.map((c) => [c.id, c.name]) },
        { name: 'description', label: 'Description', type: 'textarea', full: true, value: product?.description,
          hint: 'One line. What is actually in it.' },
        { name: 'price', label: 'Price', type: 'number', value: product?.price, required: true, min: 0 },
        { name: 'discountPrice', label: 'Offer price', type: 'number', value: product?.discountPrice ?? '',
          hint: 'Leave blank for no offer.' },
        { name: 'preparationTime', label: 'Prep time (minutes)', type: 'number', value: product?.preparationTime ?? 15 },
        { name: 'spiceLevel', label: 'Spice level', type: 'select', value: product?.spiceLevel ?? 0,
          options: [[0, 'Not spicy'], [1, 'Mild'], [2, 'Medium'], [3, 'Hot']] },
        { name: 'image', label: 'Photo', type: 'image', value: product?.image,
          hint: 'Dark background, warm side light, close crop. Leave empty to use the generated placeholder.' },
        { name: 'customizations', label: 'Option groups', type: 'select', full: true,
          value: (product?.customizations || []).join(','),
          options: [['', 'None'], ...buildCombos(groups)],
          hint: 'Which choices the customer gets in the dish popup.' },
        { name: 'veg', label: 'Vegetarian', type: 'checkbox', value: product ? product.veg !== false : true },
        { name: 'popular', label: 'Show a Bestseller badge', type: 'checkbox', value: product?.popular },
        { name: 'featured', label: 'Show on the homepage', type: 'checkbox', value: product?.featured },
        { name: 'available', label: 'Available to order', type: 'checkbox', value: product ? product.available !== false : true }
      ],
      onSubmit: async (values) => {
        if (!Number(values.price)) throw new Error('Give it a price above zero.');
        await saveProduct({
          ...(product || {}),
          ...values,
          id: product?.id,
          price: Number(values.price),
          discountPrice: values.discountPrice === '' ? null : Number(values.discountPrice),
          preparationTime: Number(values.preparationTime) || 15,
          spiceLevel: Number(values.spiceLevel) || 0,
          thumbnail: values.imageThumb ?? product?.thumbnail ?? '',
          customizations: values.customizations ? values.customizations.split(',').filter(Boolean) : []
        });
        toastOk(product ? 'Saved.' : `${values.name} added.`);
        refresh();
      }
    });
  }

  $('[data-new]', outlet).addEventListener('click', () => openForm(null));

  let onlyMissingPhotos = false;

  function applyFilters() {
    const term = $('[data-search]', outlet).value.trim().toLowerCase();
    $$('[data-row]', content).forEach((row) => {
      const matchesTerm = !term || row.dataset.name.includes(term);
      const matchesPhoto = !onlyMissingPhotos || row.dataset.photo === 'no';
      row.style.display = matchesTerm && matchesPhoto ? '' : 'none';
    });
    $$('[data-group]', content).forEach((group) => {
      const visible = $$('[data-row]', group).some((r) => r.style.display !== 'none');
      group.style.display = visible ? '' : 'none';
    });
  }

  $('[data-search]', outlet).addEventListener('input', applyFilters);

  $('[data-nophoto]', outlet).addEventListener('click', (event) => {
    onlyMissingPhotos = !onlyMissingPhotos;
    event.currentTarget.classList.toggle('btn--gold', onlyMissingPhotos);
    event.currentTarget.classList.toggle('btn--ghost', !onlyMissingPhotos);
    applyFilters();
  });

  await refresh();
}

/**
 * A dish can use several option groups. A plain select cannot express that,
 * so we offer each group on its own plus the pairs that actually get used.
 */
function buildCombos(groups) {
  const single = groups.map((g) => [g.id, g.name]);
  const pairs = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      pairs.push([`${groups[i].id},${groups[j].id}`, `${groups[i].name} + ${groups[j].name}`]);
    }
  }
  return [...single, ...pairs];
}
