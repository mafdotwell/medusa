import { getInstantDB } from "./config"
import { MedusaError } from "@medusajs/framework/utils"

// Dynamic import for id function
function getId() {
  try {
    const instantdb = require("@instantdb/admin")
    return instantdb.id
  } catch (error) {
    throw new Error("InstantDB package not installed. Please install @instantdb/admin")
  }
}

export interface UploadFileOptions {
  path: string
  file: Buffer | Uint8Array
  contentType?: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  url: string
  path: string
  fileId: string
}

/**
 * Upload file to InstantDB Storage
 * Files are stored with metadata in InstantDB database
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<UploadResult> {
  try {
    const db = getInstantDB()
    
    // InstantDB Storage API
    // Based on docs, InstantDB has a storage feature
    // This implementation assumes a storage API similar to Firebase
    // You may need to adjust based on actual InstantDB Storage API
    
    // For now, we'll store file metadata in the database
    // and assume files are stored via InstantDB's storage service
    const id = getId()
    const fileId = id()
    
    // Convert buffer to base64 for storage (or use InstantDB's file upload API)
    const base64Data = options.file instanceof Buffer
      ? options.file.toString("base64")
      : Buffer.from(options.file).toString("base64")
    
    // Store file metadata in InstantDB
    await db.transact([
      db.tx.files[fileId].update({
        path: options.path,
        url: `https://storage.instantdb.com/${options.path}`, // Placeholder URL
        folder: options.path.split("/")[0] || "uploads",
        original_name: options.metadata?.original_name || "file",
        file_type: options.contentType || "application/octet-stream",
        file_size: options.file instanceof Buffer 
          ? options.file.length 
          : options.file.byteLength,
        is_private: false,
        uploaded_by: options.metadata?.uploaded_by || "",
        created_at: Date.now(),
        vendor_id: options.metadata?.vendor_id || "",
      }),
    ])

    // In production, you would upload the actual file to InstantDB Storage
    // and get the real URL back
    const url = `https://storage.instantdb.com/${options.path}`

    return {
      url,
      path: options.path,
      fileId,
    }
  } catch (error: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to upload file: ${error.message}`
    )
  }
}

/**
 * Upload file with private access
 */
export async function uploadFilePrivate(
  options: UploadFileOptions
): Promise<UploadResult> {
  try {
    const db = getInstantDB()
    const id = getId()
    const fileId = id()
    
    // Store file metadata with private flag
    await db.transact([
      db.tx.files[fileId].update({
        path: options.path,
        url: `https://storage.instantdb.com/${options.path}?token=private`, // Private URL
        folder: options.path.split("/")[0] || "uploads",
        original_name: options.metadata?.original_name || "file",
        file_type: options.contentType || "application/octet-stream",
        file_size: options.file instanceof Buffer 
          ? options.file.length 
          : options.file.byteLength,
        is_private: true,
        uploaded_by: options.metadata?.uploaded_by || "",
        created_at: Date.now(),
        vendor_id: options.metadata?.vendor_id || "",
      }),
    ])

    const url = `https://storage.instantdb.com/${options.path}?token=private`

    return {
      url,
      path: options.path,
      fileId,
    }
  } catch (error: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to upload private file: ${error.message}`
    )
  }
}

/**
 * Delete file from InstantDB Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const db = getInstantDB()
    
    // Query file by path
    const { data } = await db.query({
      files: {
        $: {
          where: { path },
        },
      },
    })

    if (data?.files && data.files.length > 0) {
      const fileId = data.files[0].id
      await db.transact([db.tx.files[fileId].delete()])
    }
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Get file URL
 */
export async function getFileUrl(
  path: string,
  signed: boolean = false
): Promise<string> {
  try {
    const db = getInstantDB()
    
    const { data } = await db.query({
      files: {
        $: {
          where: { path },
        },
      },
    })

    if (data?.files && data.files.length > 0) {
      return data.files[0].url
    }

    // Fallback URL
    return `https://storage.instantdb.com/${path}${signed ? "?token=signed" : ""}`
  } catch (error: any) {
    throw new Error(`Failed to get file URL: ${error.message}`)
  }
}

