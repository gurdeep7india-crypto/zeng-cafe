import { esc } from '../core/dom.js';
import { footerHTML } from '../components/chrome.js';
import { getSettings } from '../services/settingsService.js';
import { BASE } from '../core/router.js';

export async function aboutPage(outlet) {
  const settings = await getSettings();

  outlet.innerHTML = `
<div class="page-head shell">
  <p class="sect__kicker">Same souls, different stories</p>
  <h1>About Zen G</h1>
</div>

<section class="sect--tight">
  <div class="shell story">
    <div class="story__art">
      <div class="arch"><img src="${BASE}/assets/img/tree-lounge.jpg" alt="The tree at the centre of the Zen G lounge" loading="lazy" width="900" height="1200"></div>
      <span class="tag">Good company,<br>better conversations</span>
    </div>
    <div>
      <h2>We built a room, not a restaurant.</h2>
      <p class="muted">Most caf&eacute;s are designed to turn a table over. This one is designed for the opposite &mdash; for the group that came at eight and left at midnight without noticing.</p>
      <p class="muted">Arched booths for the ones who came to talk. A long lounge for the group that kept growing. Lanterns low enough that the light is kind, and a rooftop for when the city looks better from above.</p>
      <p class="muted">The food is built the same way: small plates that keep arriving, platters priced for a table rather than a person, and combos that a group of four can actually split.</p>
    </div>
  </div>
</section>

<section class="sect--tight">
  <div class="shell">
    <div class="info-grid">
      <div class="info-card"><h4>What we serve</h4>
        <p class="muted" style="font-size:.9rem;margin:0">Multi-cuisine caf&eacute; food &mdash; starters, platters, pizza, pasta, Asian, Indian comfort, mocktails, shakes and desserts. Plus a signature hookah menu where permitted.</p></div>
      <div class="info-card"><h4>Who it's for</h4>
        <p class="muted" style="font-size:.9rem;margin:0">Students, young professionals, couples, birthday groups and anyone who treats a caf&eacute; as a place to stay rather than a place to eat and leave.</p></div>
      <div class="info-card"><h4>How to order</h4>
        <p class="muted" style="font-size:.9rem;margin:0">Scan the QR at your table, or order from this site for takeaway and delivery. Everything goes to our WhatsApp &mdash; no app, no account.</p></div>
      <div class="info-card"><h4>Booking</h4>
        <p class="muted" style="font-size:.9rem;margin:0">Weekends fill up. Message us on WhatsApp with a date and a headcount and we will hold a section.</p></div>
    </div>
  </div>
</section>

<section class="sect--tight">
  <div class="shell">
    <div class="notice notice--warn">
      <strong>On hookah.</strong> ${esc(settings.hookahNotice || '')}
    </div>
  </div>
</section>

<section class="sect--tight">
  <div class="shell center" style="padding-bottom:var(--s-8)">
    <p class="script gold" style="font-size:2.2rem;margin-bottom:8px">See you at Zen G</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a class="btn btn--gold" href="/menu">Explore the menu</a>
      <a class="btn btn--ghost" href="/contact">Find us</a>
    </div>
  </div>
</section>
${footerHTML(settings)}`;
}
