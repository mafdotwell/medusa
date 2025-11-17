import { getFirestoreInstance } from "./config"
import {
  DocumentData,
  Query,
  WhereFilterOp,
  FieldValue,
} from "firebase-admin/firestore"

export interface FirestoreQuery {
  field: string
  operator: WhereFilterOp
  value: any
}

export interface FirestoreOptions {
  limit?: number
  orderBy?: { field: string; direction: "asc" | "desc" }
  startAfter?: any
}

/**
 * Create a document in Firestore
 */
export async function createDocument<T extends DocumentData>(
  collection: string,
  id: string,
  data: T
): Promise<T> {
  const firestore = getFirestoreInstance()
  const docRef = firestore.collection(collection).doc(id)

  await docRef.set({
    ...data,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  })

  const doc = await docRef.get()
  return { id: doc.id, ...doc.data() } as T
}

/**
 * Get a document from Firestore
 */
export async function getDocument<T extends DocumentData>(
  collection: string,
  id: string
): Promise<T | null> {
  const firestore = getFirestoreInstance()
  const docRef = firestore.collection(collection).doc(id)
  const doc = await docRef.get()

  if (!doc.exists) {
    return null
  }

  return { id: doc.id, ...doc.data() } as T
}

/**
 * Update a document in Firestore
 */
export async function updateDocument<T extends DocumentData>(
  collection: string,
  id: string,
  data: Partial<T>
): Promise<T> {
  const firestore = getFirestoreInstance()
  const docRef = firestore.collection(collection).doc(id)

  await docRef.update({
    ...data,
    updated_at: FieldValue.serverTimestamp(),
  })

  const doc = await docRef.get()
  return { id: doc.id, ...doc.data() } as T
}

/**
 * Delete a document from Firestore
 */
export async function deleteDocument(
  collection: string,
  id: string
): Promise<void> {
  const firestore = getFirestoreInstance()
  const docRef = firestore.collection(collection).doc(id)
  await docRef.delete()
}

/**
 * Query documents from Firestore
 */
export async function queryDocuments<T extends DocumentData>(
  collection: string,
  queries?: FirestoreQuery[],
  options?: FirestoreOptions
): Promise<T[]> {
  const firestore = getFirestoreInstance()
  let query: Query = firestore.collection(collection)

  // Apply where clauses
  if (queries && queries.length > 0) {
    queries.forEach((q) => {
      query = query.where(q.field, q.operator, q.value)
    })
  }

  // Apply ordering
  if (options?.orderBy) {
    query = query.orderBy(
      options.orderBy.field,
      options.orderBy.direction
    )
  }

  // Apply pagination
  if (options?.startAfter) {
    query = query.startAfter(options.startAfter)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[]
}

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: "create" | "update" | "delete"
    collection: string
    id: string
    data?: any
  }>
): Promise<void> {
  const firestore = getFirestoreInstance()
  const batch = firestore.batch()

  operations.forEach((op) => {
    const docRef = firestore.collection(op.collection).doc(op.id)

    if (op.type === "create") {
      batch.set(docRef, {
        ...op.data,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      })
    } else if (op.type === "update") {
      batch.update(docRef, {
        ...op.data,
        updated_at: FieldValue.serverTimestamp(),
      })
    } else if (op.type === "delete") {
      batch.delete(docRef)
    }
  })

  await batch.commit()
}

