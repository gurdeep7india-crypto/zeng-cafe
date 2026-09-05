import { repo, COL } from '../data/repository.js';
import { uid } from '../core/format.js';

/* ---------------- Categories ---------------- */

export async function listCategories({ activeOnly = false } = {}) {
  const rows = await repo.list(COL.categories);
  return rows
    .filter((c) => (activeOnly ? c.active !== false : true))
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
}

export const getCategory = (id) => repo.get(COL.categories, id);

export function saveCategory(category) {
  return repo.put(COL.categories, { active: true, sortOrder: 99, ...category, id: category.id || uid('cat') });
}

export const deleteCategory = (id) => repo.remove(COL.categories, id);

export async function reorderCategories(idsInOrder) {
  const rows = await listCategories();
  const updated = rows.map((row) => ({ ...row, sortOrder: idsInOrder.indexOf(row.id) + 1 }));
  return repo.bulkPut(COL.categories, updated);
}

/* ---------------- Products ---------------- */

export async function listProducts({ availableOnly = false, categoryId = null } = {}) {
  const rows = await repo.list(COL.products);
  return rows
    .filter((p) => (availableOnly ? p.available !== false : true))
    .filter((p) => (categoryId ? p.categoryId === categoryId : true))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export const getProduct = (id) => repo.get(COL.products, id);

export function saveProduct(product) {
  return repo.put(COL.products, {
    veg: true, spiceLevel: 0, preparationTime: 15,
    popular: false, featured: false, available: true,
    customizations: [], discountPrice: null, image: '', sortOrder: 999,
    ...product,
    price: Number(product.price) || 0,
    id: product.id || uid('p')
  });
}

export const deleteProduct = (id) => repo.remove(COL.products, id);

export async function setProductFlag(id, flag, value) {
  const product = await getProduct(id);
  if (!product) return null;
  return repo.put(COL.products, { ...product, [flag]: value });
}

/** Menu grouped by category, ready to render. */
export async function buildMenu({ availableOnly = true } = {}) {
  const [categories, products] = await Promise.all([
    listCategories({ activeOnly: true }),
    listProducts({ availableOnly: false })
  ]);
  return categories
    .map((category) => ({
      category,
      items: products
        .filter((p) => p.categoryId === category.id)
        .filter((p) => (availableOnly ? true : true))
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    }))
    .filter((group) => group.items.length);
}

export async function featuredProducts(limit = 10) {
  const rows = await listProducts({ availableOnly: true });
  const featured = rows.filter((p) => p.featured);
  const rest = rows.filter((p) => !p.featured && p.popular);
  return [...featured, ...rest].slice(0, limit);
}

export async function searchProducts(term) {
  const q = String(term || '').trim().toLowerCase();
  if (!q) return [];
  const rows = await listProducts();
  return rows.filter((p) =>
    p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
}

/* ---------------- Customizations ---------------- */

export async function listCustomizations({ activeOnly = false } = {}) {
  const rows = await repo.list(COL.customizations);
  return rows.filter((c) => (activeOnly ? c.active !== false : true));
}

export const getCustomization = (id) => repo.get(COL.customizations, id);

export function saveCustomization(group) {
  return repo.put(COL.customizations, {
    type: 'single', required: false, active: true, options: [],
    ...group,
    id: group.id || uid('cz')
  });
}

export const deleteCustomization = (id) => repo.remove(COL.customizations, id);

/** Resolve a product's customization group ids into full group objects. */
export async function groupsFor(product) {
  if (!product?.customizations?.length) return [];
  const all = await listCustomizations({ activeOnly: true });
  return product.customizations
    .map((id) => all.find((g) => g.id === id))
    .filter(Boolean);
}

/* ---------------- Pricing ---------------- */

export const effectivePrice = (product) =>
  product?.discountPrice != null && product.discountPrice !== '' && Number(product.discountPrice) < Number(product.price)
    ? Number(product.discountPrice)
    : Number(product.price || 0);

/**
 * @param {object} product
 * @param {Array<{groupId,optionId,label,price}>} selections
 * @param {number} qty
 */
export function lineTotal(product, selections = [], qty = 1) {
  const extras = selections.reduce((sum, s) => sum + Number(s.price || 0), 0);
  return (effectivePrice(product) + extras) * qty;
}

/** Validate required groups are answered. Returns array of missing group names. */
export function missingRequired(groups, selections) {
  return groups
    .filter((g) => g.required)
    .filter((g) => !selections.some((s) => s.groupId === g.id))
    .map((g) => g.name);
}
