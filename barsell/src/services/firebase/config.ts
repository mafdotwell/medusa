import { initializeApp, getApps, cert, App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import { getFirestore } from "firebase-admin/firestore"

let firebaseApp: App | null = null
let firebaseAuth: ReturnType<typeof getAuth> | null = null
let firebaseStorage: ReturnType<typeof getStorage> | null = null
let firestore: ReturnType<typeof getFirestore> | null = null

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase(): {
  app: App
  auth: ReturnType<typeof getAuth>
  storage: ReturnType<typeof getStorage>
  firestore: ReturnType<typeof getFirestore>
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
    // Initialize with service account or environment variables
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined

    if (serviceAccount) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use default credentials (for environments like Cloud Run, App Engine)
      firebaseApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      })
    } else {
      throw new Error(
        "Firebase configuration missing. Please set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID"
      )
    }
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
export function getFirebaseAuth() {
  if (!firebaseAuth) {
    initializeFirebase()
  }
  return firebaseAuth!
}

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorage() {
  if (!firebaseStorage) {
    initializeFirebase()
  }
  return firebaseStorage!
}

/**
 * Get Firestore instance
 */
export function getFirestoreInstance() {
  if (!firestore) {
    initializeFirebase()
  }
  return firestore!
}

