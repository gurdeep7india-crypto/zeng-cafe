import { esc } from '../core/dom.js';
import { footerHTML } from '../components/chrome.js';
import { fmtDate } from '../core/format.js';
import { getSettings, whatsappLink } from '../services/settingsService.js';
import { listEvents } from '../services/eventService.js';
import { resolveSrc } from '../services/galleryService.js';
import { BASE } from '../core/router.js';

const dateBlock = (event) => {
  if (!event.date) return `<div class="event-date"><b>&mdash;</b><span>date soon</span></div>`;
  const d = new Date(event.date);
  return `<div class="event-date">
    <b>${String(d.getDate()).padStart(2, '0')}</b>
    <span>${d.toLocaleDateString('en-IN', { month: 'short' })}</span>
  </div>`;
};

export async function eventsPage(outlet) {
  const [settings, events] = await Promise.all([getSettings(), listEvents({ activeOnly: true })]);
  const book = whatsappLink('Hi Zen G, I want to book a table for an event.', settings);

  outlet.innerHTML = `
<div class="page-head shell">
  <p class="sect__kicker">Make tonight a story</p>
  <h1>What's on</h1>
  <p class="sect__lead">Live sets, DJ nights, college nights and birthdays. Book ahead on the weekend &mdash; the rooftop goes first.</p>
</div>

<div class="shell" style="margin-bottom:var(--s-9)">
  ${events.length ? events.map((event) => `
    <article class="event-row">
      ${dateBlock(event)}
      <div>
        <h3>${esc(event.name)}</h3>
        <p class="muted" style="margin:0">${esc(event.description || '')}</p>
        <p class="faint" style="margin:6px 0 0;font-size:.8rem">
          ${esc(event.kind || '')}${event.time ? ` &middot; ${esc(event.time)}` : ''}${event.date ? ` &middot; ${fmtDate(event.date)}` : ''}
        </p>
      </div>
      ${book ? `<a class="btn btn--ghost btn--sm" href="${esc(book)}" target="_blank" rel="noopener noreferrer">Book a table</a>`
             : `<a class="btn btn--ghost btn--sm" href="/contact">Get in touch</a>`}
    </article>`).join('') : `
    <div class="state"><h3>Nothing scheduled right now</h3>
    <p class="muted">The calendar is being filled in. Follow us for the next one.</p></div>`}

  <div class="notice" style="margin-top:var(--s-7)">
    <strong>Planning a birthday or a private party?</strong>
    Tell us the date and headcount and we will hold a section for you.
  </div>
</div>
${footerHTML(settings)}`;
}
