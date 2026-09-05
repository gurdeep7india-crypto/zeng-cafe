# Connecting Firebase

The site runs fine without this. Do it when you need the menu and orders to be
the same on every device instead of living in one browser.

## 1. Create the project
console.firebase.google.com → Add project → skip Analytics → Spark (free) plan.

## 2. Turn on Firestore
Build → Firestore Database → Create database → **Production mode** → pick the
`asia-south1` (Mumbai) region for the lowest latency from Kolkata.

## 3. Turn on Auth
Build → Authentication → Get started → Email/Password → Enable.
Then Users → Add user, one account per person who needs admin access.

## 4. Copy your config
Project settings → General → Your apps → Web (`</>`) → register the app, then
copy the `firebaseConfig` object.

## 5. Paste it in
Open `src/data/config.js`:

```js
backend: 'firebase',
firebase: {
  apiKey: '…',
  authDomain: 'zeng-cafe.firebaseapp.com',
  projectId: 'zeng-cafe',
  storageBucket: 'zeng-cafe.appspot.com',
  messagingSenderId: '…',
  appId: '…'
}
```

These values are public identifiers, not secrets. Security comes from the rules,
not from hiding the config.

## 6. Deploy the rules
Paste `firestore.rules` into Firestore → Rules → Publish, or:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## 7. Move your existing data across
Before switching: Admin → Settings → **Export everything**.
After switching and signing in: drop that file on the import zone in
Admin → Settings. Menu, tables, gallery and settings land in Firestore.

## What changes
- Admin login becomes a real email/password sign-in checked on Google's servers.
- Editing the menu on your laptop changes what every customer's phone sees.
- Orders arrive in one place instead of on whichever device took them.

## One thing to know
Order numbers (`ZG-2026-0001`) come from a counter in the settings document, so
the rules let signed-out users write to it. Two customers ordering in the same
second could in theory get the same number. If that matters, move the counter
into a Cloud Function using a Firestore transaction — nothing else changes.
