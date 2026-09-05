/**
 * Cloud Firestore adapter — the upgrade path.
 *
 * Same interface as localAdapter, so turning it on is one line in config.js
 * and nothing in the UI changes. Firebase SDK is loaded from the CDN only
 * when this adapter is actually selected, so the local build stays dependency
 * free.
 *
 * Setup:
 *   1. console.firebase.google.com → create project (Spark / free plan)
 *   2. Build → Firestore Database → Create database → production mode
 *   3. Project settings → Your apps → Web → copy the config object
 *   4. Paste it into src/data/config.js and set backend: 'firebase'
 *   5. Deploy the rules in /firebase/firestore.rules
 *   6. Authentication → Sign-in method → enable Email/Password, add your admin user
 */

import { config } from '../config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
let db = null;
let fs = null;
let auth = null;
let authMod = null;

async function boot() {
  if (db) return { db, fs, auth, authMod };
  const [app, firestore, authentication] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-firestore.js`),
    import(`${SDK}/firebase-auth.js`)
  ]);
  const instance = app.initializeApp(config.firebase);
  fs = firestore;
  authMod = authentication;
  db = firestore.getFirestore(instance);
  auth = authentication.getAuth(instance);
  return { db, fs, auth, authMod };
}

const strip = (doc) => ({ id: doc.id, ...doc.data() });

export const firebaseAdapter = {
  name: 'firebase',
  shared: true,

  async init() {
    await boot();
    return true;
  },

  async list(collection) {
    const { db, fs } = await boot();
    const snap = await fs.getDocs(fs.collection(db, collection));
    return snap.docs.map(strip);
  },

  async get(collection, id) {
    const { db, fs } = await boot();
    const snap = await fs.getDoc(fs.doc(db, collection, id));
    return snap.exists() ? strip(snap) : null;
  },

  async put(collection, doc) {
    const { db, fs } = await boot();
    const { id, ...rest } = doc;
    await fs.setDoc(fs.doc(db, collection, id), rest, { merge: true });
    return doc;
  },

  async bulkPut(collection, docs) {
    const { db, fs } = await boot();
    // Firestore batches cap at 500 writes.
    for (let i = 0; i < docs.length; i += 450) {
      const batch = fs.writeBatch(db);
      docs.slice(i, i + 450).forEach(({ id, ...rest }) => {
        batch.set(fs.doc(db, collection, id), rest, { merge: true });
      });
      await batch.commit();
    }
    return docs;
  },

  async remove(collection, id) {
    const { db, fs } = await boot();
    await fs.deleteDoc(fs.doc(db, collection, id));
    return true;
  },

  async replaceAll(collection, docs) {
    const existing = await this.list(collection);
    const keep = new Set(docs.map((d) => d.id));
    for (const row of existing) if (!keep.has(row.id)) await this.remove(collection, row.id);
    return this.bulkPut(collection, docs);
  },

  async clear(collection) {
    const rows = await this.list(collection);
    for (const row of rows) await this.remove(collection, row.id);
  },

  subscribe(collection, callback) {
    let stop = () => {};
    boot().then(({ db, fs }) => {
      stop = fs.onSnapshot(
        fs.collection(db, collection),
        (snap) => callback(snap.docs.map(strip)),
        (error) => console.error('[firebase]', collection, error)
      );
    });
    return () => stop();
  },

  /* ---- Auth (used by authService when this backend is active) ---- */

  async signIn(email, password) {
    const { auth, authMod } = await boot();
    const cred = await authMod.signInWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, email: cred.user.email };
  },

  async signOut() {
    const { auth, authMod } = await boot();
    await authMod.signOut(auth);
  },

  async currentUser() {
    const { auth, authMod } = await boot();
    return new Promise((resolve) => {
      const off = authMod.onAuthStateChanged(auth, (user) => {
        off();
        resolve(user ? { uid: user.uid, email: user.email } : null);
      });
    });
  }
};
