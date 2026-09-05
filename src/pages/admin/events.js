import { $, $$, esc } from '../../core/dom.js';
import { adminShell, formDialog, confirmDialog, emptyState, statusPill } from './shell.js';
import { fmtDate } from '../../core/format.js';
import { icons } from '../../components/icons.js';
import { listEvents, saveEvent, deleteEvent, EVENT_KINDS } from '../../services/eventService.js';
import { toastOk } from '../../components/toast.js';

export async function adminEventsPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Events',
    lead: 'Live music, DJ nights, college nights, birthdays and private parties.',
    tools: `<button class="btn btn--gold btn--sm" type="button" data-new>${icons.plus} Add an event</button>`
  });

  async function refresh() {
    const events = await listEvents();

    content.innerHTML = events.length ? `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Event</th><th>Kind</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${events.map((event) => `
          <tr>
            <td><strong>${esc(event.name)}</strong>
              <div class="faint" style="font-size:.74rem;max-width:40ch">${esc(event.description || '')}</div></td>
            <td>${esc(event.kind || '')}</td>
            <td>${event.date ? esc(fmtDate(event.date)) : '<span class="faint">Not set</span>'}</td>
            <td>${esc(event.time || '—')}</td>
            <td>${statusPill(event.active !== false)}</td>
            <td><div class="actions">
              <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(event.id)}">${icons.edit}</button>
              <button class="btn btn--danger btn--sm" type="button" data-del="${esc(event.id)}">${icons.trash}</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`
    : emptyState('Nothing scheduled', 'Add an event and it shows on the Events page.');

    $$('[data-edit]', content).forEach((b) => b.addEventListener('click', () =>
      openForm(events.find((e) => e.id === b.dataset.edit))));

    $$('[data-del]', content).forEach((b) => b.addEventListener('click', async () => {
      const event = events.find((e) => e.id === b.dataset.del);
      const yes = await confirmDialog({ title: `Delete ${event.name}?`, message: 'It comes off the Events page.' });
      if (!yes) return;
      await deleteEvent(event.id);
      toastOk('Event deleted.');
      refresh();
    }));
  }

  function openForm(event = null) {
    formDialog({
      title: event ? `Edit ${event.name}` : 'Add an event',
      submitLabel: event ? 'Save changes' : 'Add event',
      fields: [
        { name: 'name', label: 'Event name', value: event?.name, required: true },
        { name: 'kind', label: 'Kind', type: 'select', value: event?.kind, options: EVENT_KINDS },
        { name: 'date', label: 'Date', type: 'date', value: event?.date },
        { name: 'time', label: 'Start time', value: event?.time, placeholder: '9:00 PM' },
        { name: 'description', label: 'Description', type: 'textarea', full: true, value: event?.description },
        { name: 'active', label: 'Show on the site', type: 'checkbox', value: event ? event.active !== false : true }
      ],
      onSubmit: async (values) => {
        await saveEvent({ ...(event || {}), ...values, id: event?.id });
        toastOk(event ? 'Saved.' : `${values.name} added.`);
        refresh();
      }
    });
  }

  $('[data-new]', outlet).addEventListener('click', () => openForm(null));
  await refresh();
}
