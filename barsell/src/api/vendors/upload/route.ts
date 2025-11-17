import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { uploadFile, uploadFilePrivate } from "../../../services/instantdb/storage"
import MarketplaceModuleService from "../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const marketplaceModuleService: MarketplaceModuleService = 
    req.scope.resolve(MARKETPLACE_MODULE)

  // Get vendor admin by InstantDB UID
  const instantdbUid = req.instantdb_user?.uid || req.auth_context?.actor_id
  if (!instantdbUid) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "User not authenticated"
    )
  }

  // Find vendor admin by email (from InstantDB user)
  const vendorAdmins = await marketplaceModuleService.listVendorAdmins({
    email: req.instantdb_user?.email,
  })

  if (!vendorAdmins || vendorAdmins.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Vendor admin not found"
    )
  }

  const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
    vendorAdmins[0].id,
    {
      relations: ["vendor"],
    }
  )

  // Get file from request body (multipart/form-data)
  // Medusa uses body parser, so we need to handle it differently
  const body = req.body as any
  const file = body?.file || req.file
  const folder = body?.folder || "uploads"
  const isPrivate = body?.private === "true" || body?.private === true

  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "File is required. Send file as multipart/form-data with 'file' field."
    )
  }

  // Handle different file formats
  let buffer: Buffer
  let fileName: string
  let fileType: string
  let fileSize: number

  if (file instanceof Buffer) {
    buffer = file
    fileName = body?.filename || `file_${Date.now()}`
    fileType = body?.contentType || "application/octet-stream"
    fileSize = buffer.length
  } else if (file.buffer) {
    buffer = file.buffer
    fileName = file.originalname || file.filename || `file_${Date.now()}`
    fileType = file.mimetype || file.contentType || "application/octet-stream"
    fileSize = file.size || buffer.length
  } else {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid file format"
    )
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (fileSize > maxSize) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "File size exceeds 10MB limit"
    )
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ]
  if (!allowedTypes.includes(fileType)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(", ")}`
    )
  }

  // Generate unique file path
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = fileName.split(".").pop() || "bin"
  const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`
  const filePath = `vendors/${vendorAdmin.vendor.id}/${folder}/${uniqueFileName}`

  try {
    // Upload to InstantDB Storage
    const result = isPrivate
      ? await uploadFilePrivate({
          path: filePath,
          file: buffer,
          contentType: fileType,
          metadata: {
            vendor_id: vendorAdmin.vendor.id,
            original_name: fileName,
            uploaded_by: instantdbUid,
          },
        })
      : await uploadFile({
          path: filePath,
          file: buffer,
          contentType: fileType,
          metadata: {
            vendor_id: vendorAdmin.vendor.id,
            original_name: fileName,
            uploaded_by: instantdbUid,
          },
        })

    res.json({
      file: {
        url: result.url,
        path: result.path,
        name: fileName,
        size: fileSize,
        type: fileType,
        uploaded_at: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to upload file: ${error.message}`
    )
  }
}

