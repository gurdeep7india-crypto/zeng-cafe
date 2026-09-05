import { $, $$, esc } from '../../core/dom.js';
import { adminShell, emptyState } from './shell.js';
import { icons } from '../../components/icons.js';
import { qrSvg, qrPngDataUrl } from '../../core/qrcode.js';
import { download } from '../../core/image.js';
import { listTables, tableUrl } from '../../services/tableService.js';
import { getSettings } from '../../services/settingsService.js';
import { toastOk, toastErr } from '../../components/toast.js';

export async function adminQrPage(outlet) {
  const content = adminShell(outlet, {
    title: 'QR codes',
    lead: 'One code per table. Scanning opens the menu with the table already identified.',
    tools: `<button class="btn btn--ghost btn--sm" type="button" data-print>${icons.print} Print sheet</button>
            <button class="btn btn--gold btn--sm" type="button" data-all>${icons.download} Download all</button>`
  });

  const [tables, settings] = await Promise.all([listTables(), getSettings()]);
  const active = tables.filter((t) => t.active !== false);
  const origin = window.location.origin;

  if (!active.length) {
    content.innerHTML = emptyState('No active tables', 'Add tables first and switch them on.',
      '<a class="btn btn--gold" href="/admin/tables">Go to tables</a>');
    return;
  }

  content.innerHTML = `
  <div class="panel no-print">
    <h3>Before you print</h3>
    <p class="muted" style="font-size:.88rem;margin:0">
      These codes point at <strong>${esc(origin)}</strong>. If you later move the site to a different
      domain, reprint them — the old codes will point at the old address. Print at 4&nbsp;cm or larger
      and leave the white border intact, or phones will struggle to read them.
    </p>
  </div>

  <div class="qr-grid" data-grid>
    ${active.map((table) => {
      const url = tableUrl(table, origin);
      return `
      <div class="qr-card" data-table="${esc(table.name)}">
        ${qrSvg(url, { scale: 6 })}
        <b>Table ${esc(table.name)}</b>
        <small>${esc(table.zone || '')}${table.zone ? ' &middot; ' : ''}${table.capacity} seats</small>
        <small class="no-print">${esc(url)}</small>
        <div class="actions">
          <button class="btn btn--ghost btn--sm" type="button" data-png="${esc(table.name)}" data-url="${esc(url)}">PNG</button>
          <button class="btn btn--ghost btn--sm" type="button" data-copy="${esc(url)}">Copy link</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  $$('[data-png]', content).forEach((button) => button.addEventListener('click', () => {
    download(`zeng-table-${button.dataset.png}.png`, qrPngDataUrl(button.dataset.url, { scale: 12 }));
  }));

  $$('[data-copy]', content).forEach((button) => button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      toastOk('Link copied.');
    } catch {
      window.prompt('Copy this link:', button.dataset.copy);
    }
  }));

  $('[data-print]', outlet).addEventListener('click', () => window.print());

  $('[data-all]', outlet).addEventListener('click', () => {
    active.forEach((table, index) => {
      setTimeout(() => download(`zeng-table-${table.name}.png`, qrPngDataUrl(tableUrl(table, origin), { scale: 12 })), index * 220);
    });
    toastOk(`Downloading ${active.length} codes.`);
  });
}
