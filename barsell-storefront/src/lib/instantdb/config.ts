import { init } from "@instantdb/react"
import { i } from "@instantdb/react"

/**
 * InstantDB Schema for Frontend
 * Should match the backend schema
 */
const schema = i.schema({
  entities: {
    vendors: i.entity({
      name: i.string(),
      handle: i.string().optional(),
      logo: i.string().optional(),
      created_at: i.number(),
      updated_at: i.number(),
    }),
    vendor_admins: i.entity({
      email: i.string(),
      vendor_id: i.string(),
      first_name: i.string().optional(),
      last_name: i.string().optional(),
      created_at: i.number(),
      updated_at: i.number(),
    }),
    files: i.entity({
      path: i.string(),
      url: i.string(),
      vendor_id: i.string(),
      folder: i.string().optional(),
      original_name: i.string(),
      file_type: i.string(),
      file_size: i.number(),
      is_private: i.boolean(),
      uploaded_by: i.string(),
      created_at: i.number(),
    }),
  },
  links: {
    vendor_admins: {
      vendor: { type: "vendors" },
    },
    files: {
      vendor: { type: "vendors" },
    },
  },
})

let dbInstance: ReturnType<typeof init> | null = null

/**
 * Initialize InstantDB React SDK
 */
export function getInstantDB() {
  if (!dbInstance) {
    const appId = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID || "7f1dce39-2851-4889-b883-a4e4f57aa57b"

    if (!appId) {
      throw new Error(
        "InstantDB configuration missing. Please set NEXT_PUBLIC_INSTANTDB_APP_ID"
      )
    }

    dbInstance = init({
      appId,
      schema,
    })
  }
  return dbInstance
}

/**
 * Get InstantDB instance (alias)
 */
export const db = getInstantDB()

/**
 * Export db for direct use
 */
export default db

