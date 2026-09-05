import { $, $$, el, esc, debounce } from '../core/dom.js';
import { footerHTML } from '../components/chrome.js';
import { foodGridHTML } from '../components/foodCard.js';
import { buildMenu } from '../services/menuService.js';
import { getSettings } from '../services/settingsService.js';

const CURTAIN_KEY = 'zeng:curtain-seen';

export async function menuPage(outlet, { skipCurtain = false } = {}) {
  const [settings, groups] = await Promise.all([getSettings(), buildMenu()]);

  if (!groups.length) {
    outlet.innerHTML = `
      <div class="page-head shell"><h1>Menu</h1></div>
      <div class="state"><h3>The menu is being written</h3>
      <p class="muted">Nothing has been added yet. Staff can add dishes in Admin → Menu.</p></div>
      ${footerHTML(settings)}`;
    return;
  }

  outlet.innerHTML = `
<div class="menu-head shell">
  <p class="sect__kicker">What's your vibe?</p>
  <h1>The menu</h1>
  <p class="sect__lead">${esc(settings.taxNote || '')}</p>
</div>

<div class="catnav">
  <div class="catnav__scroll" role="tablist" aria-label="Menu sections">
    ${groups.map((g, i) => `
      <button type="button" role="tab" class="${i === 0 ? 'is-on' : ''}"
              data-cat="${esc(g.category.id)}" aria-selected="${i === 0}">${esc(g.category.name)}</button>`).join('')}
  </div>
</div>

<div class="shell">
  <div class="menu-search">
    <label class="sr-only" for="menu-q">Search the menu</label>
    <input id="menu-q" type="search" placeholder="Search a dish…" autocomplete="off">
    <button class="filter-chip" type="button" data-filter="veg">Veg only</button>
    <button class="filter-chip" type="button" data-filter="popular">Bestsellers</button>
    <span class="faint" data-count></span>
  </div>

  <div data-results hidden></div>

  <div data-sections>
    ${groups.map((group) => `
      <section class="menu-sect" id="cat-${esc(group.category.id)}" data-section="${esc(group.category.id)}">
        <div class="menu-sect__head">
          <h2>${esc(group.category.name)}</h2>
          <p>${esc(group.category.blurb || '')}</p>
        </div>
        ${group.category.id === 'hookah' && settings.hookahEnabled && settings.hookahNotice
          ? `<p class="notice notice--warn" style="margin-bottom:var(--s-5)">${esc(settings.hookahNotice)}</p>` : ''}
        ${foodGridHTML(group.items, 4)}
      </section>`).join('')}
  </div>
</div>

${footerHTML(settings)}`;

  wireCategoryNav(outlet);
  wireFilters(outlet, groups);

  if (!skipCurtain && !sessionStorage.getItem(CURTAIN_KEY)) {
    playCurtain();
    sessionStorage.setItem(CURTAIN_KEY, '1');
  }
}

/* --- Sticky nav follows the scroll position --- */
function wireCategoryNav(outlet) {
  const buttons = $$('.catnav button', outlet);
  const sections = $$('[data-section]', outlet);

  buttons.forEach((button) => button.addEventListener('click', () => {
    document.getElementById(`cat-${button.dataset.cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const setActive = (id) => {
    buttons.forEach((b) => {
      const on = b.dataset.cat === id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      if (on) b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (visible) setActive(visible.target.dataset.section);
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  sections.forEach((s) => observer.observe(s));
}

/* --- Search + filters --- */
function wireFilters(outlet, groups) {
  const input = $('#menu-q', outlet);
  const results = $('[data-results]', outlet);
  const sections = $('[data-sections]', outlet);
  const counter = $('[data-count]', outlet);
  const all = groups.flatMap((g) => g.items.map((item) => ({ ...item, _cat: g.category.name })));
  const state = { term: '', veg: false, popular: false };

  function apply() {
    const term = state.term.toLowerCase();
    const active = state.term || state.veg || state.popular;

    if (!active) {
      results.hidden = true;
      sections.hidden = false;
      counter.textContent = '';
      return;
    }

    const found = all.filter((p) =>
      (!term || p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term)) &&
      (!state.veg || p.veg !== false) &&
      (!state.popular || p.popular));

    sections.hidden = true;
    results.hidden = false;
    counter.textContent = `${found.length} dish${found.length === 1 ? '' : 'es'}`;
    results.innerHTML = found.length
      ? `<section class="menu-sect"><div class="menu-sect__head"><h2>Results</h2></div>${foodGridHTML(found, 6)}</section>`
      : `<div class="state"><h3>Nothing matches that</h3>
         <p class="muted">Try a shorter word, or clear the filters and browse the sections.</p></div>`;
  }

  input.addEventListener('input', debounce((e) => { state.term = e.target.value.trim(); apply(); }, 180));
  $$('[data-filter]', outlet).forEach((chip) => chip.addEventListener('click', () => {
    state[chip.dataset.filter] = !state[chip.dataset.filter];
    chip.classList.toggle('is-on', state[chip.dataset.filter]);
    apply();
  }));
}

/* --- The reveal --- */
export function playCurtain(onDone) {
  const steps = [
    ['Chill.', 'c0'], ['Connect.', 'c1'], ['Create.', 'c2'], ['Zen <i>G.</i>', 'c3']
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { onDone?.(); return; }

  const node = el('div.curtain', { html: `<b class="c0">Chill.</b><button class="curtain__skip" type="button">Skip</button>` });
  document.body.append(node);
  document.body.classList.add('no-scroll');

  const word = node.querySelector('b');
  let index = 0;
  let timer = null;

  const finish = () => {
    clearInterval(timer);
    node.classList.add('is-gone');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { node.remove(); onDone?.(); }, 700);
  };

  node.querySelector('.curtain__skip').addEventListener('click', finish);

  timer = setInterval(() => {
    index++;
    if (index >= steps.length) { finish(); return; }
    word.style.opacity = '0';
    setTimeout(() => {
      word.innerHTML = steps[index][0];
      word.className = steps[index][1];
      word.style.opacity = '1';
    }, 160);
  }, 620);
}
