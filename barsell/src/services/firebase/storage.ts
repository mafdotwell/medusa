import { getFirebaseStorage } from "./config"

export interface UploadFileOptions {
  path: string
  file: Buffer | Uint8Array
  contentType?: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  url: string
  path: string
  bucket: string
}

/**
 * Upload file to Firebase Storage
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<UploadResult> {
  const storage = getFirebaseStorage()
  const bucket = storage.bucket()

  const fileRef = bucket.file(options.path)

  try {
    await fileRef.save(options.file, {
      metadata: {
        contentType: options.contentType || "application/octet-stream",
        metadata: options.metadata || {},
      },
    })

    // Make file publicly accessible (or use signed URLs for private files)
    await fileRef.makePublic()

    // Get public URL
    const url = `https://storage.googleapis.com/${bucket.name}/${options.path}`

    return {
      url,
      path: options.path,
      bucket: bucket.name,
    }
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }
}

/**
 * Upload file with custom access control
 */
export async function uploadFilePrivate(
  options: UploadFileOptions
): Promise<UploadResult> {
  const storage = getFirebaseStorage()
  const bucket = storage.bucket()

  const fileRef = bucket.file(options.path)

  try {
    await fileRef.save(options.file, {
      metadata: {
        contentType: options.contentType || "application/octet-stream",
        metadata: options.metadata || {},
      },
    })

    // Generate signed URL for private access
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-09-2491", // Far future date
    })

    return {
      url,
      path: options.path,
      bucket: bucket.name,
    }
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const storage = getFirebaseStorage()
  const bucket = storage.bucket()

  const fileRef = bucket.file(path)

  try {
    await fileRef.delete()
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Get download URL for a file
 */
export async function getFileUrl(path: string, signed: boolean = false): Promise<string> {
  const storage = getFirebaseStorage()
  const bucket = storage.bucket()

  const fileRef = bucket.file(path)

  try {
    if (signed) {
      const [url] = await fileRef.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      })
      return url
    } else {
      // Public URL
      return `https://storage.googleapis.com/${bucket.name}/${path}`
    }
  } catch (error: any) {
    throw new Error(`Failed to get file URL: ${error.message}`)
  }
}

