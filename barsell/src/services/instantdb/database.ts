import { getInstantDB } from "./config"

// Dynamic import for id function
function getId() {
  try {
    const instantdb = require("@instantdb/admin")
    return instantdb.id
  } catch (error) {
    throw new Error("InstantDB package not installed. Please install @instantdb/admin")
  }
}

/**
 * Database operations using InstantDB
 * Replaces Firestore operations
 */

export interface QueryOptions {
  limit?: number
  orderBy?: { field: string; direction: "asc" | "desc" }
  where?: Record<string, any>
}

/**
 * Create a document in InstantDB
 */
export async function createDocument<T extends Record<string, any>>(
  entity: string,
  data: T
): Promise<T & { id: string }> {
  const db = getInstantDB()
  const id = getId()
  const documentId = id()

  await db.transact([
    db.tx[entity as keyof typeof db.tx][documentId].update({
      ...data,
      created_at: Date.now(),
      updated_at: Date.now(),
    }),
  ])

  return {
    id: documentId,
    ...data,
    created_at: Date.now(),
    updated_at: Date.now(),
  } as T & { id: string }
}

/**
 * Get a document from InstantDB
 */
export async function getDocument<T extends Record<string, any>>(
  entity: string,
  documentId: string
): Promise<(T & { id: string }) | null> {
  const db = getInstantDB()

  const { data } = await db.query({
    [entity]: {
      $: {
        where: { id: documentId },
      },
    },
  })

  const documents = data?.[entity as keyof typeof data] as (T & { id: string })[]
  return documents && documents.length > 0 ? documents[0] : null
}

/**
 * Update a document in InstantDB
 */
export async function updateDocument<T extends Record<string, any>>(
  entity: string,
  documentId: string,
  data: Partial<T>
): Promise<T & { id: string }> {
  const db = getInstantDB()

  await db.transact([
    db.tx[entity as keyof typeof db.tx][documentId].update({
      ...data,
      updated_at: Date.now(),
    }),
  ])

  // Fetch updated document
  const updated = await getDocument<T>(entity, documentId)
  if (!updated) {
    throw new Error(`Document ${documentId} not found after update`)
  }

  return updated
}

/**
 * Delete a document from InstantDB
 */
export async function deleteDocument(
  entity: string,
  documentId: string
): Promise<void> {
  const db = getInstantDB()

  await db.transact([
    db.tx[entity as keyof typeof db.tx][documentId].delete(),
  ])
}

/**
 * Query documents from InstantDB
 */
export async function queryDocuments<T extends Record<string, any>>(
  entity: string,
  options?: QueryOptions
): Promise<(T & { id: string })[]> {
  const db = getInstantDB()

  const query: any = {
    [entity]: {
      $: {},
    },
  }

  // Apply where clause
  if (options?.where) {
    query[entity].$.where = options.where
  }

  // Apply limit
  if (options?.limit) {
    query[entity].$.limit = options.limit
  }

  const { data } = await db.query(query)
  const documents = data?.[entity as keyof typeof data] as (T & { id: string })[]

  // Apply ordering (client-side for now, InstantDB may support server-side)
  if (options?.orderBy && documents) {
    documents.sort((a, b) => {
      const aVal = a[options.orderBy!.field]
      const bVal = b[options.orderBy!.field]
      const direction = options.orderBy!.direction === "desc" ? -1 : 1
      if (aVal < bVal) return -1 * direction
      if (aVal > bVal) return 1 * direction
      return 0
    })
  }

  return documents || []
}

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: "create" | "update" | "delete"
    entity: string
    id: string
    data?: any
  }>
): Promise<void> {
  const db = getInstantDB()

  const transactions = operations.map((op) => {
    const entityTx = db.tx[op.entity as keyof typeof db.tx]
    if (op.type === "create") {
      return entityTx[op.id].update({
        ...op.data,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
    } else if (op.type === "update") {
      return entityTx[op.id].update({
        ...op.data,
        updated_at: Date.now(),
      })
    } else {
      return entityTx[op.id].delete()
    }
  })

  await db.transact(transactions)
}

