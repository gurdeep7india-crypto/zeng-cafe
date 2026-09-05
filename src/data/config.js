/**
 * Backend selection.
 *
 * 'local'    → LocalStorage. Zero cost, zero setup, single browser only.
 * 'firebase' → Cloud Firestore. Free Spark tier. Shared across every device.
 *
 * Switch by setting `backend: 'firebase'` and filling in firebaseConfig, or by
 * defining window.__ZENG_CONFIG__ before app.js loads (see index.html).
 *
 * Nothing above the data layer knows or cares which one is active.
 */

const defaults = {
  backend: 'local',

  // Paste the config object from Firebase console → Project settings → Your apps.
  // Firebase web config values are public identifiers, not secrets; access is
  // controlled by the Firestore rules in /firebase/firestore.rules.
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },

  // Namespace for LocalStorage keys.
  storagePrefix: 'zeng:v1:',

  // Firestore document that holds the single settings record.
  settingsDocId: 'main'
};

export const config = { ...defaults, ...(window.__ZENG_CONFIG__ || {}) };

export const usingFirebase = () =>
  config.backend === 'firebase' && Boolean(config.firebase?.projectId);
