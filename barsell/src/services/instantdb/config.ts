// Dynamic import to handle cases where package might not be installed
let instantdbModule: any = null
let schema: any = null

try {
  instantdbModule = require("@instantdb/admin")
  schema = require("../../instant.schema").default || require("../../instant.schema")
} catch (error) {
  // Package not installed - will throw error at runtime when used
  console.warn("InstantDB package not found. Install @instantdb/admin to use InstantDB features.")
}

let dbInstance: any = null

/**
 * Initialize InstantDB Admin SDK
 */
export function getInstantDB() {
  if (!instantdbModule) {
    throw new Error(
      "InstantDB package not installed. Please install @instantdb/admin: npm install @instantdb/admin"
    )
  }

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

    dbInstance = instantdbModule.init({
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

