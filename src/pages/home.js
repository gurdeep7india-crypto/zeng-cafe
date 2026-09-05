import { $, $$, esc } from '../core/dom.js';
import { icons } from '../components/icons.js';
import { footerHTML } from '../components/chrome.js';
import { foodGridHTML } from '../components/foodCard.js';
import { featuredProducts } from '../services/menuService.js';
import { getSettings, mapsLink, whatsappLink } from '../services/settingsService.js';
import { BASE } from '../core/router.js';

const WHY = [
  ['Food',   'Bold, affordable, comfort-driven food. Small plates that keep arriving, platters built for a table of six.'],
  ['Vibe',   'Moroccan lanterns, arched niches, a tree in the middle of the room, and light warm enough to stay under for hours.'],
  ['People', 'Friends after class, couples on a second date, a group that came for one hookah and stayed for four.'],
  ['Create', 'The conversations you did not plan. The photos you did not stage. The night you tell people about later.'],
  ['Nights', 'Live sets, DJ nights, birthdays with the whole room singing. Book the rooftop before someone else does.']
];

const SIGNATURE = [
  { word: 'Chill.',   sub: 'Coffee, low light, nowhere to be',  image: 'water-wall.jpg' },
  { word: 'Connect.', sub: 'Friends, food, four hours gone',    image: 'tree-lounge.jpg' },
  { word: 'Create.',  sub: 'Music, ideas, memories',            image: 'mural-neon.jpg' },
  { word: 'Zen G.',   sub: "More than a café. It's a vibe.",    image: 'lounge-wide.jpg' }
];

export async function homePage(outlet) {
  const [settings, picks] = await Promise.all([getSettings(), featuredProducts(10)]);
  const maps = mapsLink(settings);
  const wa = whatsappLink('Hi Zen G! I would like to know more.', settings);

  outlet.innerHTML = `
<section class="hero">
  <div class="hero__bg">
    ${settings.heroVideo ? `
    <video autoplay muted loop playsinline preload="metadata"
           poster="${BASE}/assets/img/hero-main.jpg"
           aria-hidden="true" tabindex="-1">
      <source src="${esc(settings.heroVideo)}" type="video/mp4">
    </video>` : `
    <picture>
      <source media="(max-width: 700px)" srcset="${BASE}/assets/img/hero-mobile.webp" type="image/webp">
      <source srcset="${BASE}/assets/img/hero-main.webp" type="image/webp">
      <img src="${BASE}/assets/img/hero-main.jpg" alt="The Zen G lounge at night, lit by lanterns and neon" fetchpriority="high" width="1536" height="1024">
    </picture>`}
  </div>
  <div class="hero__scrim"></div>
  <div class="hero__inner">
    <img class="hero__logo" src="${BASE}/assets/img/logo.png" alt="Zen G Café" width="140" height="140">
    <h1>
      Not just a café.
      <span class="line2"><span class="type">It's a vibe.</span></span>
    </h1>
    <p class="hero__triad"><i>Chill.</i><i>Connect.</i><i>Create.</i></p>
    <div class="hero__cta">
      <a class="btn btn--gold" href="/menu">Explore the menu</a>
      <a class="btn btn--magenta" href="/order">Order now</a>
      <a class="btn btn--ghost" href="/contact">Visit Zen G</a>
    </div>
  </div>
  <span class="hero__scroll">Scroll</span>
</section>

<nav class="quickbar" aria-label="Quick actions">
  <a href="/order">${icons.fork}<b>Order food</b><em>dine-in or delivery</em></a>
  <a href="/menu">${icons.menu}<b>View menu</b><em>everything we make</em></a>
  ${wa
    ? `<a href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${icons.chat}<b>WhatsApp</b><em>talk to us</em></a>`
    : `<a href="/contact">${icons.chat}<b>WhatsApp</b><em>coming soon</em></a>`}
  ${maps
    ? `<a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">${icons.pin}<b>Directions</b><em>${esc(settings.city || 'Kolkata')}</em></a>`
    : `<a href="/contact">${icons.pin}<b>Directions</b><em>${esc(settings.city || 'Kolkata')}</em></a>`}
</nav>

<section class="signature" aria-label="Chill, connect, create">
  <div class="signature__stage">
    ${SIGNATURE.map((s, i) => `
      <div class="signature__frame${i === 0 ? ' is-live' : ''}" data-frame="${i}">
        <img src="${BASE}/assets/img/${s.image}" alt="" loading="lazy" width="1100" height="600">
      </div>`).join('')}
    <div class="signature__word" data-step="0">
      <b data-word>Chill.</b>
      <small data-sub>${esc(SIGNATURE[0].sub)}</small>
    </div>
    <div class="signature__rail" aria-hidden="true">
      ${SIGNATURE.map((_, i) => `<span class="${i === 0 ? 'on' : ''}"></span>`).join('')}
    </div>
  </div>
</section>

<section class="sect">
  <div class="shell story">
    <div class="story__art">
      <div class="arch"><img src="${BASE}/assets/img/arch-cabins.jpg" alt="Arched seating niches inside Zen G" loading="lazy" width="900" height="1200"></div>
      <span class="tag">Good food,<br>good mood</span>
    </div>
    <div>
      <p class="sect__kicker">Same city, bolder vibes</p>
      <h2>More than a café.</h2>
      <blockquote>Zen G is where food, conversations, music, creativity and good company come together.</blockquote>
      <p class="muted">We built the room the way a good night actually goes. Arched booths for the talking, a long lounge for the group that grew, a rooftop for when the city looks better from above.</p>
      <div class="triad-lines">
        <div><b>Chill</b><p>Low light, slow service on purpose, nobody rushing your table.</p></div>
        <div><b>Connect</b><p>Platters built for sharing and seats that face each other.</p></div>
        <div><b>Create</b><p>Live sets, open decks, and a wall worth photographing.</p></div>
      </div>
    </div>
  </div>
</section>

<section class="sect--tight">
  <div class="shell" style="margin-bottom:var(--s-5)">
    <p class="sect__kicker">Why people keep coming back</p>
    <h2>Five reasons, in the order they happen.</h2>
  </div>
  <div class="why">
    ${WHY.map(([title, copy], i) => `
      <div class="why__row">
        <span class="why__n">${String(i + 1).padStart(2, '0')}</span>
        <h3>${title}</h3>
        <p>${esc(copy)}</p>
      </div>`).join('')}
  </div>
</section>

<section class="sect" id="signature-food">
  <div class="shell">
    <p class="sect__kicker">Come hungry</p>
    <h2 style="margin-bottom:6px">Leave with a story.</h2>
    <p class="sect__lead" style="margin-bottom:var(--s-6)">The dishes that leave the kitchen most often. Tap any of them to customise and add.</p>
    ${foodGridHTML(picks, 4)}
    <div style="margin-top:var(--s-6);display:flex;gap:12px;flex-wrap:wrap">
      <a class="btn btn--gold" href="/menu">See the full menu</a>
      <a class="btn btn--ghost" href="/order">Start an order</a>
    </div>
  </div>
</section>

<section class="sect--tight">
  <div class="shell">
    <div class="notice notice--info">
      <strong>Your table. Your people. Your night.</strong>
      Scan the QR on your table to order without waiting, or send your order straight to our WhatsApp.
    </div>
  </div>
</section>

${footerHTML(settings)}`;

  return mountSignature(outlet);
}

/**
 * Drives the chill → connect → create → Zen G sequence.
 * One long sticky section, four steps, scroll position picks the step.
 * Falls back to a plain stacked reveal when motion is reduced.
 */
function mountSignature(outlet) {
  const section = $('.signature', outlet);
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    section.classList.add('is-static');
    $('[data-word]', section).textContent = 'Chill. Connect. Create.';
    $('[data-sub]', section).textContent = "More than a café. It's a vibe.";
    return;
  }

  const word = $('[data-word]', section);
  const sub = $('[data-sub]', section);
  const holder = $('.signature__word', section);
  const frames = $$('.signature__frame', section);
  const rails = $$('.signature__rail span', section);
  let step = -1;

  function paint(next) {
    if (next === step) return;
    step = next;
    const entry = SIGNATURE[next];
    word.style.opacity = '0';
    sub.style.opacity = '0';
    word.style.transform = 'translateY(14px)';
    setTimeout(() => {
      word.innerHTML = next === 3 ? 'Zen <i>G.</i>' : esc(entry.word);
      sub.textContent = entry.sub;
      holder.dataset.step = String(next);
      word.style.opacity = '1';
      sub.style.opacity = '1';
      word.style.transform = 'none';
    }, 200);
    frames.forEach((f, i) => f.classList.toggle('is-live', i === next));
    rails.forEach((r, i) => r.classList.toggle('on', i === next));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - window.innerHeight;
      if (travel <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      paint(Math.min(3, Math.floor(progress * 4)));
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  paint(0);

  return () => window.removeEventListener('scroll', onScroll);
}
