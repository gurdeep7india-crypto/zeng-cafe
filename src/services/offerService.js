import { repo, COL } from '../data/repository.js';
import { uid } from '../core/format.js';

export async function listOffers({ activeOnly = false } = {}) {
  const rows = await repo.list(COL.offers);
  return rows.filter((o) => (activeOnly ? o.active !== false : true));
}

export function saveOffer(offer) {
  return repo.put(COL.offers, {
    type: 'percent', active: true, minimumOrder: 0, categoryId: '',
    ...offer,
    code: String(offer.code || '').toUpperCase().trim(),
    discount: Number(offer.discount) || 0,
    id: offer.id || uid('o')
  });
}

export const deleteOffer = (id) => repo.remove(COL.offers, id);

const withinDates = (offer, now) => {
  if (offer.startDate && now < offer.startDate) return false;
  if (offer.endDate && now > offer.endDate) return false;
  return true;
};

/** @returns {{ok:boolean, offer?:object, reason?:string}} */
export async function validateCoupon(code, subtotal) {
  const wanted = String(code || '').toUpperCase().trim();
  if (!wanted) return { ok: false, reason: 'Enter a code first.' };
  const offers = await listOffers({ activeOnly: true });
  const offer = offers.find((o) => o.code === wanted);
  if (!offer) return { ok: false, reason: 'That code is not one of ours.' };
  const today = new Date().toISOString().slice(0, 10);
  if (!withinDates(offer, today)) return { ok: false, reason: 'That code has expired.' };
  if (subtotal < Number(offer.minimumOrder || 0)) {
    return { ok: false, reason: `Add ₹${Number(offer.minimumOrder) - subtotal} more to use ${offer.code}.` };
  }
  return { ok: true, offer };
}
