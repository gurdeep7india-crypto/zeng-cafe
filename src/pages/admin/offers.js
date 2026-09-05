import { $, $$, esc } from '../../core/dom.js';
import { adminShell, formDialog, confirmDialog, emptyState, statusPill } from './shell.js';
import { rupee, fmtDate } from '../../core/format.js';
import { icons } from '../../components/icons.js';
import { listOffers, saveOffer, deleteOffer } from '../../services/offerService.js';
import { listCategories } from '../../services/menuService.js';
import { toastOk } from '../../components/toast.js';

export async function adminOffersPage(outlet) {
  const content = adminShell(outlet, {
    title: 'Offers',
    lead: 'Discount codes customers can type at checkout.',
    tools: `<button class="btn btn--gold btn--sm" type="button" data-new>${icons.plus} Add an offer</button>`
  });

  let categories = [];

  async function refresh() {
    const [offers, cats] = await Promise.all([listOffers(), listCategories()]);
    categories = cats;

    content.innerHTML = offers.length ? `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Code</th><th>Name</th><th>Discount</th><th>Minimum</th><th>Runs</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${offers.map((offer) => `
          <tr>
            <td><strong style="font-family:var(--f-display);letter-spacing:.08em">${esc(offer.code)}</strong></td>
            <td>${esc(offer.name)}</td>
            <td class="gold">${offer.type === 'flat' ? rupee(offer.discount) : `${offer.discount}%`}</td>
            <td>${offer.minimumOrder ? rupee(offer.minimumOrder) : '<span class="faint">none</span>'}</td>
            <td class="faint" style="font-size:.74rem">
              ${offer.startDate || offer.endDate
                ? `${offer.startDate ? esc(fmtDate(offer.startDate)) : 'now'} → ${offer.endDate ? esc(fmtDate(offer.endDate)) : 'no end'}`
                : 'always'}</td>
            <td>${statusPill(offer.active !== false)}</td>
            <td><div class="actions">
              <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(offer.id)}">${icons.edit}</button>
              <button class="btn btn--danger btn--sm" type="button" data-del="${esc(offer.id)}">${icons.trash}</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="faint" style="font-size:.78rem;margin-top:14px">
      Codes are checked at checkout against the subtotal. No countdown timers, no fake scarcity.
    </p>`
    : emptyState('No offers running', 'Add a code and customers can use it at checkout.');

    $$('[data-edit]', content).forEach((b) => b.addEventListener('click', () =>
      openForm(offers.find((o) => o.id === b.dataset.edit))));

    $$('[data-del]', content).forEach((b) => b.addEventListener('click', async () => {
      const offer = offers.find((o) => o.id === b.dataset.del);
      const yes = await confirmDialog({ title: `Delete ${offer.code}?`, message: 'Customers using it will be told the code is not ours.' });
      if (!yes) return;
      await deleteOffer(offer.id);
      toastOk('Offer deleted.');
      refresh();
    }));
  }

  function openForm(offer = null) {
    formDialog({
      title: offer ? `Edit ${offer.code}` : 'Add an offer',
      submitLabel: offer ? 'Save changes' : 'Add offer',
      fields: [
        { name: 'code', label: 'Code', value: offer?.code, required: true, hint: 'Uppercase, no spaces. ZEN10.' },
        { name: 'name', label: 'Internal name', value: offer?.name, required: true },
        { name: 'type', label: 'Discount type', type: 'select', value: offer?.type || 'percent',
          options: [['percent', 'Percentage off'], ['flat', 'Flat rupees off']] },
        { name: 'discount', label: 'Amount', type: 'number', value: offer?.discount, required: true,
          hint: '10 means 10% or ₹10 depending on the type.' },
        { name: 'minimumOrder', label: 'Minimum order', type: 'number', value: offer?.minimumOrder ?? 0 },
        { name: 'startDate', label: 'Starts', type: 'date', value: offer?.startDate },
        { name: 'endDate', label: 'Ends', type: 'date', value: offer?.endDate },
        { name: 'active', label: 'Running', type: 'checkbox', value: offer ? offer.active !== false : true }
      ],
      onSubmit: async (values) => {
        if (!Number(values.discount)) throw new Error('Give the discount a value.');
        await saveOffer({
          ...(offer || {}), ...values, id: offer?.id,
          minimumOrder: Number(values.minimumOrder) || 0
        });
        toastOk(offer ? 'Saved.' : `${values.code} added.`);
        refresh();
      }
    });
  }

  $('[data-new]', outlet).addEventListener('click', () => openForm(null));
  await refresh();
}
