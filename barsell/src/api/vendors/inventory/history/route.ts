import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const marketplaceModuleService: MarketplaceModuleService = 
    req.scope.resolve(MARKETPLACE_MODULE)

  const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
    req.auth_context.actor_id,
    {
      relations: ["vendor"],
    }
  )

  // Parse query parameters
  const inventoryItemId = req.query.inventory_item_id as string | undefined
  const locationId = req.query.location_id as string | undefined
  const changeType = req.query.change_type as string | undefined
  const startDate = req.query.start_date 
    ? new Date(req.query.start_date as string)
    : undefined
  const endDate = req.query.end_date
    ? new Date(req.query.end_date as string)
    : undefined
  const limit = Number(req.query.limit) || 100
  const offset = Number(req.query.offset) || 0

  // Get inventory history
  const history = await marketplaceModuleService.getInventoryHistory({
    vendor_id: vendorAdmin.vendor.id,
    inventory_item_id: inventoryItemId,
    location_id: locationId,
    change_type: changeType,
    start_date: startDate,
    end_date: endDate,
  })

  // Apply pagination
  const paginatedHistory = history.slice(offset, offset + limit)

  res.json({
    history: paginatedHistory,
    total: history.length,
    limit,
    offset,
  })
}

