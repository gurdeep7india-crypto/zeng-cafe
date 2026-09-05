# Going live — checklist

Print this. Tick as you go.

## 1. Put it online
- [ ] Site deployed, URL noted here: ______________________________

## 2. Point the site at its own address
Three files still say `https://zeng-cafe.vercel.app`. Replace with your real URL:
- [ ] `index.html` — the `<link rel="canonical">` tag
- [ ] `robots.txt` — the `Sitemap:` line
- [ ] `sitemap.xml` — every `<loc>` line

Skip this and Google may index the wrong address.

## 3. First run
- [ ] Open `/admin` → create a passcode (6+ characters). Write it down.
- [ ] Settings → **WhatsApp number**. Nothing can be ordered until this is set.
- [ ] Settings → phone, email, address, Google Maps link
- [ ] Settings → Instagram / Facebook / YouTube (placeholders stay hidden until replaced)
- [ ] Settings → opening hours
- [ ] Settings → dine-in / takeaway / delivery switches
- [ ] Settings → hookah notice — check the wording against your actual licence

## 4. Test the order yourself
- [ ] Add a dish, go to checkout, send the order
- [ ] Confirm the WhatsApp message arrives on the café phone and reads correctly
- [ ] Repeat once as delivery, to check the address fields

## 5. Tables and QR codes
Do this **after** the final domain is set — codes carry the URL.
- [ ] Tables → make the list match your actual floor
- [ ] QR → Print sheet, or download PNGs
- [ ] Scan one with a real phone before printing 30
- [ ] Print at 4 cm or larger, keep the white border

## 6. Connect Firebase
Until you do, orders are saved in the **customer's** browser, so the admin
Orders screen stays empty and menu edits do not reach other devices.
See `firebase/README-firebase.md`.
- [ ] Firebase project created, Firestore + Email auth on
- [ ] Config pasted into `src/data/config.js`, `backend: 'firebase'`
- [ ] Rules from `firebase/firestore.rules` published
- [ ] Data exported from the old browser and imported after switching
- [ ] Redeployed, staff signed in, test order visible in Orders

## 7. Content
- [ ] Replace placeholder food photos with real ones
- [ ] Gallery → swap in your own photos of the actual room
- [ ] Events → add what is really on
- [ ] Offers → check ZEN10 is what you want, or delete it
