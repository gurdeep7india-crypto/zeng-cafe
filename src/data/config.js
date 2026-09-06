/**
 * Backend selection.
 *
 * 'local'    → LocalStorage. Zero cost, zero setup, single browser only.
 * 'firebase' → Cloud Firestore. Free Spark tier. Shared across every device.
 *
 * Nothing above the data layer knows or cares which one is active.
 */

const defaults = {
  // Live. Menu, settings and orders are shared across every device.
  // Set this back to 'local' to work offline without touching Firebase.
  backend: 'firebase',

  // From Firebase console → Project settings → Your apps.
  // These are public identifiers, not secrets: every visitor's browser
  // downloads them. What protects the data is firebase/firestore.rules,
  // which only lets signed-in staff write.
  firebase: {
    apiKey: 'AIzaSyDnaEypcuhs7DB2GWy9X327TzhEre-jf5s',
    authDomain: 'zeng-cafe.firebaseapp.com',
    projectId: 'zeng-cafe',
    storageBucket: 'zeng-cafe.firebasestorage.app',
    messagingSenderId: '96524073928',
    appId: '1:96524073928:web:2aefc3c311014a8ee7defd'
  },

  // Namespace for LocalStorage keys (the cart and admin session still live here).
  storagePrefix: 'zeng:v1:',

  // Firestore document that holds the single settings record.
  settingsDocId: 'main'
};

export const config = { ...defaults, ...(window.__ZENG_CONFIG__ || {}) };

export const usingFirebase = () =>
  config.backend === 'firebase' && Boolean(config.firebase?.projectId);
