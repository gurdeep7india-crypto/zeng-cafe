import { $, $$, esc } from '../../core/dom.js';
import { adminShell, formDialog, confirmDialog, emptyState, statusPill } from './shell.js';
import { rupee } from '../../core/format.js';
import { icons } from '../../components/icons.js';
import { listCustomizations, saveCustomization, deleteCustomization, listProducts } from '../../services/menuService.js';
import { toastOk } from '../../components/toast.js';

/** Options are edited as one line each: "Extra cheese | 40" */
const parseOptions = (text) => String(text || '').split('\n')
  .map((line) => line.trim()).filter(Boolean)
  .map((line, index) => {
    const [label, price] = line.split('|').map((s) => (s || '').trim());
    return { id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `opt${index}`, label, price: Number(price) || 0 };
  });

const printOptions = (options = []) =>
  options.map((o) => (o.price ? `${o.label} | ${o.price}` : o.label)).join('\n');

export async function adminCustomizationsPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Options',
    lead: 'The choices a customer gets in the dish popup. Nothing here is hard-coded.',
    tools: `<button class="btn btn--gold btn--sm" type="button" data-new>${icons.plus} Add a group</button>`
  });

  async function refresh() {
    const [groups, products] = await Promise.all([listCustomizations(), listProducts()]);
    const usedBy = (id) => products.filter((p) => (p.customizations || []).includes(id)).length;

    content.innerHTML = groups.length ? `
    <div class="panel-grid">
      ${groups.map((group) => `
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <h3 style="margin-bottom:4px">${esc(group.name)}</h3>
            <p class="faint" style="font-size:.74rem;margin:0">
              ${group.type === 'multi' ? 'Pick any number' : 'Pick one'}${group.required ? ' &middot; required' : ''}
              &middot; used by ${usedBy(group.id)} dish${usedBy(group.id) === 1 ? '' : 'es'}
            </p>
          </div>
          ${statusPill(group.active !== false)}
        </div>
        <ul style="list-style:none;padding:0;margin:14px 0 0">
          ${group.options.map((option) => `
            <li style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.88rem">
              <span>${esc(option.label)}</span>
              <span class="${option.price ? 'gold' : 'faint'}">${option.price ? `+${rupee(option.price)}` : 'no charge'}</span>
            </li>`).join('')}
        </ul>
        <div class="actions" style="margin-top:14px">
          <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(group.id)}">${icons.edit} Edit</button>
          <button class="btn btn--danger btn--sm" type="button" data-del="${esc(group.id)}">${icons.trash}</button>
        </div>
      </div>`).join('')}
    </div>`
    : emptyState('No option groups yet', 'Add one — spice level and add-ons are the usual starting point.');

    $$('[data-edit]', content).forEach((b) => b.addEventListener('click', () =>
      openForm(groups.find((g) => g.id === b.dataset.edit))));

    $$('[data-del]', content).forEach((b) => b.addEventListener('click', async () => {
      const group = groups.find((g) => g.id === b.dataset.del);
      const yes = await confirmDialog({
        title: `Delete ${group.name}?`,
        message: `${usedBy(group.id)} dish(es) use this group. They will simply stop showing the choice.`
      });
      if (!yes) return;
      await deleteCustomization(group.id);
      toastOk('Group deleted.');
      refresh();
    }));
  }

  function openForm(group = null) {
    formDialog({
      title: group ? `Edit ${group.name}` : 'Add an option group',
      submitLabel: group ? 'Save changes' : 'Add group',
      fields: [
        { name: 'name', label: 'Group name', value: group?.name, required: true, hint: 'Shown as a heading, e.g. Spice level' },
        { name: 'type', label: 'How many can they pick?', type: 'select', value: group?.type || 'single',
          options: [['single', 'Exactly one'], ['multi', 'Any number']] },
        { name: 'options', label: 'Options', type: 'textarea', full: true, required: true,
          value: printOptions(group?.options),
          hint: 'One per line. Add a price with a pipe: Extra cheese | 40' },
        { name: 'required', label: 'Customer must choose', type: 'checkbox', value: group?.required },
        { name: 'active', label: 'In use', type: 'checkbox', value: group ? group.active !== false : true }
      ],
      onSubmit: async (values) => {
        const options = parseOptions(values.options);
        if (!options.length) throw new Error('Add at least one option.');
        await saveCustomization({ ...(group || {}), ...values, options, id: group?.id });
        toastOk(group ? 'Saved.' : `${values.name} added.`);
        refresh();
      }
    });
  }

  $('[data-new]', outlet).addEventListener('click', () => openForm(null));
  await refresh();
}
