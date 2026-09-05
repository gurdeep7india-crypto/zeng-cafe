import { esc } from '../core/dom.js';
import { footerHTML } from '../components/chrome.js';
import { getSettings } from '../services/settingsService.js';

const contactLine = (s) => [s.phone, s.email, s.address].filter(Boolean).join(' &middot; ')
  || 'Contact details are set in Admin &rarr; Settings.';

const DOCS = {
  privacy: (s) => ({
    title: 'Privacy',
    body: `
      <p>We collect the least we need to cook your food and get it to you: your name, your mobile number, and for delivery, your address. Nothing else.</p>
      <h3>Where it goes</h3>
      <p>Your order is sent to our WhatsApp Business number as a message you send yourself. WhatsApp's own privacy terms apply to that message. A copy of the order is stored so our staff can track it through the kitchen.</p>
      <h3>What we never do</h3>
      <p>We do not sell your details, we do not run advertising trackers on this site, and we do not ask you to create an account.</p>
      <h3>Removing your details</h3>
      <p>Message us on WhatsApp and ask. We will delete your order records.</p>
      <p class="muted">This page describes how the website behaves. Have it reviewed against the Digital Personal Data Protection Act, 2023 before you rely on it commercially.</p>`
  }),
  terms: () => ({
    title: 'Terms',
    body: `
      <h3>Orders</h3>
      <p>An order placed through this website is a request, not a confirmed sale. It becomes an order once we reply on WhatsApp and accept it. We may decline an order if an item has run out or if we cannot deliver to your area.</p>
      <h3>Prices</h3>
      <p>Prices shown are proposed launch prices and exclude applicable taxes and service charges. The amount confirmed on WhatsApp is the amount payable.</p>
      <h3>Age and hookah</h3>
      <p>Hookah service, where offered, is available only to guests aged 18 and above, only where permitted by applicable law and licensing, and subject to venue rules. Smoking is harmful. We make no health claims about hookah.</p>
      <h3>Behaviour</h3>
      <p>We reserve the right to refuse service.</p>`
  }),
  refunds: () => ({
    title: 'Refunds and cancellation',
    body: `
      <h3>Cancelling</h3>
      <p>You can cancel free of charge any time before we confirm the order on WhatsApp. Once the kitchen has started, we cannot cancel a food order.</p>
      <h3>Something wrong with the order</h3>
      <p>Tell us on WhatsApp the same day, with a photo if you can. If we got it wrong, we remake it or refund it. That is the whole policy.</p>
      <h3>Refund timing</h3>
      <p>Refunds go back the way the payment came in. Card and UPI refunds usually settle in five to seven working days, depending on your bank.</p>`
  }),
  delivery: (s) => ({
    title: 'Delivery',
    body: `
      <h3>Where we deliver</h3>
      <p>${esc(s.deliveryRadiusNote || 'We confirm your area on WhatsApp before we start cooking.')}</p>
      <h3>Timing</h3>
      <p>Most orders leave the kitchen within 30 to 45 minutes. Weekend nights run longer. We will give you a realistic time on WhatsApp rather than an optimistic one on a screen.</p>
      <h3>If nobody answers</h3>
      <p>Our rider will call the number on the order twice. If there is no answer after ten minutes at the address, the order is treated as delivered.</p>`
  })
};

export async function legalPage(outlet, ctx) {
  const settings = await getSettings();
  const make = DOCS[ctx.params.doc];

  if (!make) {
    outlet.innerHTML = `<div class="page-head shell"><h1>Not a page we have</h1>
      <p class="muted">Try Privacy, Terms, Refunds or Delivery from the footer.</p></div>${footerHTML(settings)}`;
    return;
  }

  const doc = make(settings);
  outlet.innerHTML = `
<div class="page-head shell"><p class="sect__kicker">The small print</p><h1>${esc(doc.title)}</h1></div>
<div class="shell" style="max-width:760px;margin-bottom:var(--s-9)">
  ${doc.body}
  <p class="notice" style="margin-top:var(--s-6)">Questions about any of this: ${contactLine(settings)}</p>
</div>
${footerHTML(settings)}`;
}
