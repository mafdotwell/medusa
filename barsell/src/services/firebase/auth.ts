import { getFirebaseAuth } from "./config"
import { DecodedIdToken } from "firebase-admin/auth"

/**
 * Verify Firebase ID token and return decoded token
 */
export async function verifyFirebaseToken(
  idToken: string
): Promise<DecodedIdToken> {
  const auth = getFirebaseAuth()
  try {
    const decodedToken = await auth.verifyIdToken(idToken)
    return decodedToken
  } catch (error: any) {
    throw new Error(`Firebase token verification failed: ${error.message}`)
  }
}

/**
 * Get user by Firebase UID
 */
export async function getFirebaseUser(uid: string) {
  const auth = getFirebaseAuth()
  try {
    const user = await auth.getUser(uid)
    return user
  } catch (error: any) {
    throw new Error(`Failed to get Firebase user: ${error.message}`)
  }
}

/**
 * Create custom token for user
 */
export async function createCustomToken(uid: string, additionalClaims?: object) {
  const auth = getFirebaseAuth()
  try {
    const token = await auth.createCustomToken(uid, additionalClaims)
    return token
  } catch (error: any) {
    throw new Error(`Failed to create custom token: ${error.message}`)
  }
}

/**
 * Set custom user claims (for role-based access)
 */
export async function setCustomUserClaims(
  uid: string,
  customClaims: object
) {
  const auth = getFirebaseAuth()
  try {
    await auth.setCustomUserClaims(uid, customClaims)
  } catch (error: any) {
    throw new Error(`Failed to set custom claims: ${error.message}`)
  }
}

/**
 * Delete user
 */
export async function deleteFirebaseUser(uid: string) {
  const auth = getFirebaseAuth()
  try {
    await auth.deleteUser(uid)
  } catch (error: any) {
    throw new Error(`Failed to delete Firebase user: ${error.message}`)
  }
}

