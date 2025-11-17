import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyInstantDBToken } from "../services/instantdb/auth"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * InstantDB Authentication Middleware
 * Verifies InstantDB token and attaches user info to request
 */
export async function instantdbAuthMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: () => Promise<void>
) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization
    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.cookies?.["instantdb_token"] || req.cookies?.["_medusa_jwt"]

    if (!token) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "Authentication token required"
      )
    }

    // Verify InstantDB token
    const decodedToken = await verifyInstantDBToken(token)

    // Attach user info to request
    req.instantdb_user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      custom_claims: decodedToken,
    }

    // Map InstantDB user to Medusa auth context format
    req.auth_context = {
      actor_id: decodedToken.uid,
      auth_identity_id: decodedToken.uid,
      actor_type: decodedToken.role || "user",
      app_metadata: decodedToken,
    }

    await next()
  } catch (error: any) {
    if (error instanceof MedusaError) {
      throw error
    }
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      `Authentication failed: ${error.message}`
    )
  }
}

/**
 * InstantDB Auth middleware for vendor routes
 * Verifies token and checks if user has vendor role
 */
export async function instantdbVendorAuthMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: () => Promise<void>
) {
  try {
    await instantdbAuthMiddleware(req, res, async () => {
      // Check if user has vendor role or custom claim
      const customClaims = req.instantdb_user?.custom_claims || {}
      const isVendor = customClaims.role === "vendor" || customClaims.vendor_id

      if (!isVendor) {
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          "Vendor access required"
        )
      }

      // Set vendor_id in auth context if available
      if (customClaims.vendor_id) {
        req.auth_context = {
          ...req.auth_context!,
          actor_id: customClaims.vendor_id,
        }
      }

      await next()
    })
  } catch (error: any) {
    if (error instanceof MedusaError) {
      throw error
    }
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      `Vendor authentication failed: ${error.message}`
    )
  }
}

// Extend MedusaRequest type
declare module "@medusajs/framework/http" {
  interface MedusaRequest {
    instantdb_user?: {
      uid: string
      email?: string
      email_verified?: boolean
      custom_claims?: any
    }
  }
}

