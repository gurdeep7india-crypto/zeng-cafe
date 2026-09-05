# Zen G Café — website, QR ordering and admin panel

Chill. Connect. Create.

A complete café site: a customer-facing brand experience, a fast QR ordering
flow that ends in WhatsApp, and an admin panel that manages the whole thing.

No build step. No dependencies. No paid services.

---

## Run it locally

The site uses ES modules and the History API, so it needs a server — opening
`index.html` from the filesystem will not work.

```bash
npx serve -s .          # or: python3 -m http.server 3000
```

Then open `http://localhost:3000`.

The `-s` flag matters: it rewrites unknown paths to `index.html`, which is what
makes `/menu` and `/admin/orders` work on a refresh.

---

## Deploy

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Framework preset: **Other**. Build command: none. Output directory: `.`
`vercel.json` already handles the SPA rewrites, cache headers and clean URLs.

### GitHub Pages

Push to a repo, then Settings → Pages → deploy from branch → root.
`404.html` handles deep links. For a project site (`user.github.io/zeng-cafe`)
set the base path in `index.html`:

```js
window.__ZENG_BASE__ = '/zeng-cafe';
```

### Cloudflare Pages
Connect the repo, leave the build command empty, output directory `/`.

---

## First fifteen minutes after deploying

1. Go to `/admin`. You will be asked to **create a passcode** — no default
   ships in the source. Six characters minimum. Write it down.
2. **Settings → WhatsApp number.** Until you do this, customers cannot send
   orders. The checkout says so plainly rather than failing silently.
3. **Settings → address, phone, social links.** The Instagram, Facebook and
   YouTube fields hold `REPLACE_WITH_…` placeholders; those links stay hidden
   on the live site until you put real ones in.
4. **Tables → check the twelve seeded tables** match your floor, then
   **QR codes → Print sheet.**
5. **Menu → replace the food photos.** Every dish currently shows a generated
   dark plate. See "Food photography" below.

The dashboard shows a checklist of whatever is still missing.

---

## How the ordering flow works

```
QR on table  →  /order?table=07  →  table identified, dine-in preselected
                                           ↓
   browse → tap a dish → customise → add → cart → checkout
                                           ↓
              name + mobile (+ address for delivery)
                                           ↓
                 order saved  →  WhatsApp opens pre-filled
```

No registration. No account. No payment gateway. The order arrives in your
WhatsApp as a structured plain-text message that you confirm before cooking.

If WhatsApp is blocked or unavailable, "Copy the order text instead" puts the
same message on the clipboard.

---

## Project layout

```
index.html            shell + SEO + structured data
404.html              GitHub Pages deep-link shim
vercel.json           rewrites, cache headers
assets/img/           brand photography, logo, generated icons
firebase/             Firestore rules + setup guide
src/
  app.js              routes, guards, boot
  core/               dom, router, format, image, qrcode, placeholder
  data/
    config.js         ← the one file you edit to switch backend
    seed.js           menu transcribed from the PDF
    repository.js     the seam between app and storage
    adapters/         localAdapter.js · firebaseAdapter.js
  services/           menu, cart, order, table, settings, offer, event,
                      gallery, auth, orderContext
  components/         chrome, foodCard, foodModal, cartDrawer, toast, icons
  pages/              customer pages
  pages/admin/        twelve admin screens + shared shell
  styles/             tokens, base, components, pages, admin
```

**The data layer is the point.** Services never import an adapter. They import
`repository.js`. Both adapters implement the same async interface
(`list · get · put · bulkPut · remove · replaceAll · clear · subscribe`), so
moving to Firestore is a config change, not a rewrite.

---

## Storage: the honest version

By default everything lives in **LocalStorage in one browser on one device.**

This is not a cloud CMS. If you edit the menu on your laptop, the phone in the
kitchen will not see it. If you clear browser data, the menu, orders and
settings go with it.

That is a deliberate trade to get a working system at zero cost on day one, and
the admin panel says so in the sidebar and on the dashboard rather than
pretending otherwise. **Export your data regularly** (Settings → Export
everything).

When you outgrow it, follow `firebase/README-firebase.md`. Takes about ten
minutes and the frontend does not change.

### Admin login

In local mode the passcode is checked in the browser against a salted SHA-256
hash. It keeps customers out of the admin screens. It is **not** production
authentication — someone determined can read the data in devtools. The login
screen labels itself "Local demo admin" for exactly this reason. Connect
Firebase for real, server-enforced auth.

---

## Food photography

Every dish without a photo shows a generated placeholder: dark ground, warm
side light, tinted plate, the dish's initials. They look intentional rather
than broken, and they are honest about being placeholders.

When you shoot the real thing, match the room:

- black or very dark background
- warm light from the side, not the front
- steam, condensation, oil sheen — texture reads as freshness
- close crop, plate filling the frame
- shoot at 4:3, the card aspect ratio

Upload in Admin → Menu → edit a dish → Photo. Images are resized to 1400px and
re-encoded to WebP in the browser before saving, so a 4 MB phone photo becomes
roughly 150 KB. Without that, a dozen uploads would fill the LocalStorage quota.

---

## The QR system

`src/core/qrcode.js` is a complete QR encoder written for this project — byte
mode, versions 1 to 10, error correction level M, all eight mask patterns with
proper penalty scoring. It was validated module-for-module against a reference
implementation across every version and block layout.

No CDN script, no runtime dependency, works offline, and the codes are yours.

Each table gets `https://yourdomain/order?table=07`. Print at 4 cm or larger and
keep the white quiet zone — scanners need it.

**If you change domain, reprint the codes.** The admin page warns you which
origin the current codes point at.

---

## Accessibility and performance

- Keyboard navigable throughout; focus is trapped in modals and drawers and
  returned on close.
- `prefers-reduced-motion` respected — the hero typing, the scroll sequence and
  the menu curtain all degrade to static.
- Semantic landmarks, real `<button>` elements, labelled form fields, live
  regions on the cart and toasts.
- Images lazy-load below the fold; the hero is preloaded with `fetchpriority`.
- WebP with JPEG fallback via `<picture>`.
- Zero JavaScript dependencies. Nothing to audit, nothing to update.

---

## Legal notes

- **Hookah.** The compliance notice in Settings appears on the hookah section
  and inside every hookah dish popup. It states 18+, licence-dependent
  availability, and makes no health claims. Check the wording against your
  actual licence and current West Bengal rules before launch.
- **Prices** are the proposed launch prices from the menu PDF, exclusive of
  taxes and service charges, and editable everywhere.
- The four policy pages (privacy, terms, refunds, delivery) are written to be
  accurate to how this site actually behaves. Have them reviewed against the
  Digital Personal Data Protection Act, 2023 before relying on them
  commercially.

---

## What is deliberately not here

- **No payment gateway.** Orders confirm on WhatsApp and you take payment as
  you do now. Adding Razorpay later touches only `checkout.js`.
- **No fake urgency.** No countdown timers, no "3 people are viewing this".
- **No live order notifications.** With Firebase connected, `repo.subscribe()`
  already streams changes — wiring it to a sound in the kitchen is a small job.

---

## Single-file builds

`build-preview.mjs` flattens the whole site into one `.html` that runs from a
double-click — no server, no network. Three size tiers:

```bash
node build-preview.mjs           # ~1.6 MB — best looking, local viewing
node build-preview.mjs --light   # ~650 KB — minified, smaller images
node build-preview.mjs --tiny    # ~480 KB — smallest, for upload size limits
```

`src/` is never modified. These are throwaway artefacts for previewing.

They carry shims the real site does not need: a memory store when
`localStorage` is blocked, and a virtual URL because `history.pushState` throws
without a real origin. **The browser back button does not work in these
builds.** It works normally once deployed.

For sharing with other people, deploy to Vercel instead — you get a real URL,
working back button, full-resolution images and functioning QR codes.
