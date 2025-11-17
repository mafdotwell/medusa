import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getStorage, FirebaseStorage } from "firebase/storage"
import { getFirestore, Firestore } from "firebase/firestore"

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let firebaseStorage: FirebaseStorage | null = null
let firestore: Firestore | null = null

/**
 * Initialize Firebase client SDK
 */
export function initializeFirebaseClient(): {
  app: FirebaseApp
  auth: Auth
  storage: FirebaseStorage
  firestore: Firestore
} {
  if (firebaseApp) {
    return {
      app: firebaseApp,
      auth: firebaseAuth!,
      storage: firebaseStorage!,
      firestore: firestore!,
    }
  }

  // Check if Firebase is already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]
  } else {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error(
        "Firebase configuration missing. Please set NEXT_PUBLIC_FIREBASE_* environment variables"
      )
    }

    firebaseApp = initializeApp(firebaseConfig)
  }

  firebaseAuth = getAuth(firebaseApp)
  firebaseStorage = getStorage(firebaseApp)
  firestore = getFirestore(firebaseApp)

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    storage: firebaseStorage,
    firestore: firestore,
  }
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuthClient() {
  if (!firebaseAuth) {
    initializeFirebaseClient()
  }
  return firebaseAuth!
}

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorageClient() {
  if (!firebaseStorage) {
    initializeFirebaseClient()
  }
  return firebaseStorage!
}

/**
 * Get Firestore instance
 */
export function getFirestoreClient() {
  if (!firestore) {
    initializeFirebaseClient()
  }
  return firestore!
}

