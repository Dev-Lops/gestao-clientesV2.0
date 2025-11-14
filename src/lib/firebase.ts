import { getClientEnv, validateClientEnv } from "@/lib/env";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

// Evita crash durante SSR (Next.js avalia módulos client-side no build)
const isClient = typeof window !== "undefined";

// Configuração do Firebase
const cenv = getClientEnv();
const v = validateClientEnv(cenv);
const firebaseConfig = {
  apiKey: cenv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: cenv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: cenv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: cenv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: cenv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: cenv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicialização condicional — só no cliente
let firebaseApp: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let provider: GoogleAuthProvider | undefined;

if (isClient) {
  if (!v.ok) {
    console.warn(`⚠️ Missing Firebase env vars: ${v.missing.join(", ")}`);
  }
  // Type refinement: ensure all required properties are present before init
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  ) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);

    // Configura persistência local para manter o usuário logado
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("✅ Firebase Auth persistence configurada");
      })
      .catch((error) => {
        console.error("❌ Erro ao configurar persistence:", error);
      });

    provider = new GoogleAuthProvider();
  } else {
    // Avoid throwing to keep dev experience smoother; initialization will be skipped.
    console.warn(
      "⚠️ Firebase initialization skipped due to missing critical env vars.",
    );
  }
}

// Alias de compatibilidade: alguns módulos podem importar `app`
const app = firebaseApp;

export { app, auth, db, firebaseApp, provider };
