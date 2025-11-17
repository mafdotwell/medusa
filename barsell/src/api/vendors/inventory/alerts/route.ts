import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import { IInventoryModuleService } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const marketplaceModuleService: MarketplaceModuleService = 
    req.scope.resolve(MARKETPLACE_MODULE)
  const inventoryModuleService: IInventoryModuleService = req.scope
    .resolve(Modules.INVENTORY)

  const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
    req.auth_context.actor_id,
    {
      relations: ["vendor"],
    }
  )

  // Parse query parameters
  const threshold = Number(req.query.threshold) || 10 // Default low stock threshold
  const locationId = req.query.location_id as string | undefined

  // Get vendor's products
  const { data: [vendor] } = await query.graph({
    entity: "vendor",
    fields: ["products.*", "products.variants.*"],
    filters: {
      id: [vendorAdmin.vendor.id],
    },
  })

  if (!vendor || !vendor.products) {
    return res.json({
      alerts: [],
    })
  }

  // Get vendor's stock locations
  const vendorLocationLinks = await link.list({
    [MARKETPLACE_MODULE]: {
      vendor_id: vendorAdmin.vendor.id,
    },
  })

  const vendorLocationIds = vendorLocationLinks
    .map((link) => link[Modules.STOCK_LOCATION]?.stock_location_id)
    .filter(Boolean)

  if (vendorLocationIds.length === 0) {
    return res.json({
      alerts: [],
    })
  }

  // Get all inventory items for vendor's products
  const variantIds = vendor.products.flatMap((p: any) => 
    p.variants?.map((v: any) => v.id) || []
  )

  // Get inventory items linked to variants
  const inventoryItemLinks = await link.list({
    [Modules.PRODUCT]: {
      variant_id: variantIds,
    },
  })

  const inventoryItemIds = inventoryItemLinks
    .map((link) => link[Modules.INVENTORY]?.inventory_item_id)
    .filter(Boolean)

  if (inventoryItemIds.length === 0) {
    return res.json({
      alerts: [],
    })
  }

  // Get inventory levels
  const inventoryLevels = await inventoryModuleService.listInventoryLevels({
    inventory_item_id: inventoryItemIds,
    location_id: locationId ? [locationId] : vendorLocationIds,
  })

  // Get stock locations
  const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
  const locations = await stockLocationModuleService.listStockLocations({
    id: vendorLocationIds,
  })

  // Find low stock items
  const alerts = await Promise.all(
    inventoryLevels
      .filter((level) => {
        const available = level.stocked_quantity - level.reserved_quantity
        return available <= threshold
      })
      .map(async (level) => {
        // Find the inventory item link to get variant info
        const itemLink = inventoryItemLinks.find(
          (link) => link[Modules.INVENTORY]?.inventory_item_id === level.inventory_item_id
        )
        
        const variantId = itemLink?.[Modules.PRODUCT]?.variant_id
        const variant = vendor.products
          .flatMap((p: any) => p.variants || [])
          .find((v: any) => v.id === variantId)

        const product = variant ? vendor.products.find((p: any) => 
          p.variants?.some((v: any) => v.id === variantId)
        ) : null

        const location = locations.find((loc) => loc.id === level.location_id)

        const available = level.stocked_quantity - level.reserved_quantity

        return {
          alert_type: available === 0 ? "out_of_stock" : "low_stock",
          inventory_item_id: level.inventory_item_id,
          location_id: level.location_id,
          location_name: location?.name || "Unknown",
          stocked_quantity: level.stocked_quantity,
          reserved_quantity: level.reserved_quantity,
          available_quantity: available,
          threshold,
          variant_id: variantId,
          variant: variant ? {
            id: variant.id,
            title: variant.title,
            sku: variant.sku,
          } : null,
          product: product ? {
            id: product.id,
            title: product.title,
            handle: product.handle,
          } : null,
        }
      })
  )

  res.json({
    alerts: alerts.sort((a, b) => a.available_quantity - b.available_quantity),
    summary: {
      total_alerts: alerts.length,
      out_of_stock: alerts.filter((a) => a.alert_type === "out_of_stock").length,
      low_stock: alerts.filter((a) => a.alert_type === "low_stock").length,
    },
  })
}

