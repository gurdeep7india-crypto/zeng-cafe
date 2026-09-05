import { esc } from '../core/dom.js';
import { icons } from '../components/icons.js';
import { footerHTML, socialHTML } from '../components/chrome.js';
import { getSettings, mapsLink, whatsappLink, isOpenNow } from '../services/settingsService.js';

export async function contactPage(outlet) {
  const settings = await getSettings();
  const maps = mapsLink(settings);
  const wa = whatsappLink('Hi Zen G!', settings);
  const status = isOpenNow(settings);

  const action = (href, icon, label, sub, external = true) => href
    ? `<a class="info-card" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}
          style="display:flex;gap:14px;align-items:center">
         <span style="color:var(--gold);flex:0 0 24px">${icons[icon]}</span>
         <span><b style="display:block">${label}</b><small class="faint">${esc(sub)}</small></span>
       </a>`
    : `<div class="info-card" style="display:flex;gap:14px;align-items:center;opacity:.55">
         <span style="flex:0 0 24px">${icons[icon]}</span>
         <span><b style="display:block">${label}</b><small class="faint">Not set up yet</small></span>
       </div>`;

  outlet.innerHTML = `
<div class="page-head shell">
  <p class="sect__kicker">Come for the food, stay for the vibe</p>
  <h1>Find us</h1>
  <p class="${status.open ? 'gold' : 'muted'}">${status.open ? 'Open right now.' : 'Closed right now.'}
    ${status.today && !status.today.closed ? `Today ${esc(status.today.open)} to ${esc(status.today.close)}.` : ''}</p>
</div>

<div class="shell" style="margin-bottom:var(--s-9)">
  <div class="info-grid" style="margin-bottom:var(--s-6)">
    ${action(maps, 'pin', 'Get directions', settings.address || settings.city || 'Kolkata')}
    ${action(settings.phone ? `tel:${settings.phone}` : '', 'phone', 'Call Zen G', settings.phone || '', false)}
    ${action(wa, 'chat', 'WhatsApp', 'Orders and bookings')}
    ${action(settings.email ? `mailto:${settings.email}` : '', 'sparkle', 'Email', settings.email || '', false)}
  </div>

  <div class="info-grid">
    <div class="info-card">
      <h4>Address</h4>
      <p class="muted" style="margin:0">
        ${settings.address ? esc(settings.address) : '<span class="faint">The address goes in Admin &rarr; Settings before you share this site.</span>'}
        ${settings.city ? `<br>${esc(settings.city)}` : ''}
      </p>
    </div>
    <div class="info-card">
      <h4>Opening hours</h4>
      <ul class="hours-list">
        ${(settings.openingHours || []).map((h) => `
          <li><span>${esc(h.day)}</span><span>${h.closed ? 'Closed' : `${esc(h.open)} &ndash; ${esc(h.close)}`}</span></li>`).join('')}
      </ul>
    </div>
    <div class="info-card">
      <h4>Follow</h4>
      <div class="social">${socialHTML(settings)}</div>
      <p class="faint" style="font-size:.78rem;margin:14px 0 0">Tag us and we will repost the good ones.</p>
    </div>
  </div>

  ${maps ? `
  <div style="margin-top:var(--s-6);border:1px solid var(--hair);border-radius:var(--r-md);overflow:hidden">
    <iframe title="Zen G Caf&eacute; on the map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            style="width:100%;height:340px;border:0;filter:grayscale(.3) invert(.92) hue-rotate(180deg)"
            src="https://maps.google.com/maps?q=${encodeURIComponent(settings.address || settings.city || 'Kolkata')}&output=embed"></iframe>
  </div>` : ''}
</div>
${footerHTML(settings)}`;
}
