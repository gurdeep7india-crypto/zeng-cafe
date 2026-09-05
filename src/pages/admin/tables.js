import { $, $$, esc } from '../../core/dom.js';
import { adminShell, formDialog, confirmDialog, emptyState, statusPill } from './shell.js';
import { icons } from '../../components/icons.js';
import { listTables, saveTable, deleteTable, tableUrl } from '../../services/tableService.js';
import { toastOk } from '../../components/toast.js';

export async function adminTablesPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Tables',
    lead: 'Each table gets its own ordering link. Print the codes from the QR page.',
    tools: `<a class="btn btn--ghost btn--sm" href="/admin/qr">${icons.qr} QR codes</a>
            <button class="btn btn--gold btn--sm" type="button" data-new>${icons.plus} Add a table</button>`
  });

  async function refresh() {
    const tables = await listTables();

    content.innerHTML = tables.length ? `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Table</th><th>Zone</th><th>Seats</th><th>Ordering link</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${tables.map((table) => `
          <tr>
            <td><strong style="font-family:var(--f-display);font-size:1.1rem">${esc(table.name)}</strong></td>
            <td>${esc(table.zone || '—')}</td>
            <td>${table.capacity}</td>
            <td class="faint" style="font-size:.74rem;word-break:break-all">${esc(tableUrl(table))}</td>
            <td>
              <label class="switch"><input type="checkbox" data-active="${esc(table.id)}"
                ${table.active !== false ? 'checked' : ''} aria-label="Table ${esc(table.name)} active"><i></i></label>
            </td>
            <td><div class="actions">
              <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(table.id)}">${icons.edit}</button>
              <button class="btn btn--danger btn--sm" type="button" data-del="${esc(table.id)}">${icons.trash}</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`
    : emptyState('No tables yet', 'Add them here, then print a QR code for each one.');

    $$('[data-active]', content).forEach((toggle) => toggle.addEventListener('change', async () => {
      const table = tables.find((t) => t.id === toggle.dataset.active);
      await saveTable({ ...table, active: toggle.checked });
      toastOk(toggle.checked ? 'Table active.' : 'Table switched off.');
    }));

    $$('[data-edit]', content).forEach((b) => b.addEventListener('click', () =>
      openForm(tables.find((t) => t.id === b.dataset.edit))));

    $$('[data-del]', content).forEach((b) => b.addEventListener('click', async () => {
      const table = tables.find((t) => t.id === b.dataset.del);
      const yes = await confirmDialog({
        title: `Delete table ${table.name}?`,
        message: 'Any printed QR code for this table will stop identifying it.'
      });
      if (!yes) return;
      await deleteTable(table.id);
      toastOk('Table deleted.');
      refresh();
    }));
  }

  function openForm(table = null) {
    formDialog({
      title: table ? `Edit table ${table.name}` : 'Add a table',
      submitLabel: table ? 'Save changes' : 'Add table',
      fields: [
        { name: 'name', label: 'Table number or name', value: table?.name, required: true,
          hint: 'Keep it short — it goes in the QR link, like 07.' },
        { name: 'zone', label: 'Zone', value: table?.zone, hint: 'Lounge, Cabins, Rooftop…' },
        { name: 'capacity', label: 'Seats', type: 'number', value: table?.capacity ?? 4, min: 1 },
        { name: 'active', label: 'Taking orders', type: 'checkbox', value: table ? table.active !== false : true }
      ],
      onSubmit: async (values) => {
        await saveTable({ ...(table || {}), ...values, capacity: Number(values.capacity) || 4, id: table?.id });
        toastOk(table ? 'Saved.' : `Table ${values.name} added.`);
        refresh();
      }
    });
  }

  $('[data-new]', outlet).addEventListener('click', () => openForm(null));
  await refresh();
}
