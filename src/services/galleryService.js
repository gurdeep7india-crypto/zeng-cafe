import { repo, COL } from '../data/repository.js';
import { uid } from '../core/format.js';

/** Bundled images are stored as filenames; uploads as data URIs. */
export const resolveSrc = (src) =>
  !src ? '' : /^(data:|https?:|\/|assets\/)/.test(src) ? src : `assets/img/${src}`;

export async function listGallery({ activeOnly = false } = {}) {
  const rows = await repo.list(COL.gallery);
  return rows
    .filter((g) => (activeOnly ? g.active !== false : true))
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
}

export function saveGalleryItem(shot) {
  return repo.put(COL.gallery, { active: true, sortOrder: 99, tag: 'Interior', ...shot, id: shot.id || uid('g') });
}

export const deleteGalleryItem = (id) => repo.remove(COL.gallery, id);

export async function reorderGallery(idsInOrder) {
  const rows = await listGallery();
  return repo.bulkPut(COL.gallery, rows.map((r) => ({ ...r, sortOrder: idsInOrder.indexOf(r.id) + 1 })));
}
