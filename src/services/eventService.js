import { repo, COL } from '../data/repository.js';
import { uid } from '../core/format.js';

export const EVENT_KINDS = ['Live Music', 'DJ Night', 'College Night', 'Birthday Night', 'Private Party', 'Special Event'];

export async function listEvents({ activeOnly = false, upcomingOnly = false } = {}) {
  const rows = await repo.list(COL.events);
  const today = new Date().toISOString().slice(0, 10);
  return rows
    .filter((e) => (activeOnly ? e.active !== false : true))
    .filter((e) => (upcomingOnly && e.date ? e.date >= today : true))
    .sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')));
}

export function saveEvent(event) {
  return repo.put(COL.events, { active: true, kind: 'Special Event', ...event, id: event.id || uid('e') });
}

export const deleteEvent = (id) => repo.remove(COL.events, id);
