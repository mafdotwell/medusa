import { init } from "@instantdb/admin"
import schema from "../../instant.schema"

let dbInstance: ReturnType<typeof init> | null = null

/**
 * Initialize InstantDB Admin SDK
 */
export function getInstantDB() {
  if (!dbInstance) {
    const appId = process.env.INSTANTDB_APP_ID || "7f1dce39-2851-4889-b883-a4e4f57aa57b"
    const adminToken = process.env.INSTANTDB_ADMIN_TOKEN

    if (!appId) {
      throw new Error(
        "InstantDB configuration missing. Please set INSTANTDB_APP_ID"
      )
    }

    if (!adminToken) {
      throw new Error(
        "InstantDB admin token missing. Please set INSTANTDB_ADMIN_TOKEN for server-side operations"
      )
    }

    dbInstance = init({
      appId,
      adminToken,
      schema,
    })
  }
  return dbInstance
}

/**
 * Get InstantDB instance (alias for getInstantDB)
 */
export function getDB() {
  return getInstantDB()
}

