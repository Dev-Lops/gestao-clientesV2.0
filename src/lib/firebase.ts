import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Only initialize Firebase in the browser. This avoids throwing during
// server-side module evaluation (Next.js app router may import client
// components during build/SSR). If env vars are missing, log a warning
// instead of throwing so the server can continue to render.

const isClient = typeof window !== 'undefined'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: ReturnType<typeof initializeApp> | null = null
let db: ReturnType<typeof getFirestore> | null = null
let auth: ReturnType<typeof getAuth> | null = null
let provider: GoogleAuthProvider | null = null

if (isClient) {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length) {
    // Do not throw during module evaluation; warn and let client handle
    // missing config at runtime.
    console.warn(`Missing Firebase env vars: ${missing.join(', ')}`)
  } else {
    firebaseApp =
      getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    db = getFirestore(firebaseApp)
    auth = getAuth(firebaseApp)
    provider = new GoogleAuthProvider()
  }
}

export { auth, db, firebaseApp, provider }
