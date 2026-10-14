import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Configuracion de Firebase leida desde variables de entorno (ver .env.example).
 * Estas claves son publicas por diseno: la seguridad real la dan las
 * Firestore Security Rules (ver firestore.rules), no el secreto del API key.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function createFirebaseApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0 && existing[0]) return existing[0];

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      '[firebase] Faltan variables de entorno VITE_FIREBASE_*. Revisa tu archivo .env (ver .env.example).',
    );
  }

  return initializeApp(firebaseConfig);
}

export const firebaseApp: FirebaseApp = createFirebaseApp();
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
