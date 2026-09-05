import { $$, esc } from '../core/dom.js';
import { footerHTML } from '../components/chrome.js';
import { getSettings } from '../services/settingsService.js';
import { listGallery, resolveSrc } from '../services/galleryService.js';
import { BASE } from '../core/router.js';

export async function galleryPage(outlet) {
  const [settings, shots] = await Promise.all([getSettings(), listGallery({ activeOnly: true })]);
  const tags = [...new Set(shots.map((s) => s.tag).filter(Boolean))];

  outlet.innerHTML = `
<div class="page-head shell">
  <p class="sect__kicker">Insta-worthy every corner</p>
  <h1>The room</h1>
  <p class="sect__lead">Every wall in here was built to be photographed. These are ours &mdash; yours will be better.</p>
</div>

<div class="shell">
  ${tags.length > 1 ? `
  <div class="menu-search" role="group" aria-label="Filter photos">
    <button class="filter-chip is-on" type="button" data-tag="">Everything</button>
    ${tags.map((t) => `<button class="filter-chip" type="button" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}
  </div>` : ''}

  ${shots.length ? `
  <div class="masonry" data-grid>
    ${shots.map((shot) => `
      <figure data-tag="${esc(shot.tag || '')}">
        <img src="${esc(resolveSrc(shot.src).startsWith('assets/') ? BASE + '/' + resolveSrc(shot.src) : resolveSrc(shot.src))}"
             alt="${esc(shot.caption || 'Zen G Caf&eacute;')}" loading="lazy" decoding="async">
        ${shot.caption ? `<figcaption>${esc(shot.caption)}</figcaption>` : ''}
      </figure>`).join('')}
  </div>` : `
  <div class="state"><h3>No photos yet</h3>
  <p class="muted">Staff can upload them in Admin &rarr; Gallery.</p></div>`}
</div>
${footerHTML(settings)}`;

  $$('[data-tag]', outlet).forEach((chip) => {
    if (chip.tagName !== 'BUTTON') return;
    chip.addEventListener('click', () => {
      const want = chip.dataset.tag;
      $$('.filter-chip', outlet).forEach((c) => c.classList.toggle('is-on', c === chip));
      $$('.masonry figure', outlet).forEach((fig) => {
        fig.style.display = !want || fig.dataset.tag === want ? '' : 'none';
      });
    });
  });
}
