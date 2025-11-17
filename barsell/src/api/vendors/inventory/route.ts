import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import MarketplaceModuleService from "../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
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
      inventory: [],
      locations: [],
    })
  }

  // Get vendor's stock locations via links
  const vendorLocationLinks = await link.list({
    [MARKETPLACE_MODULE]: {
      vendor_id: vendorAdmin.vendor.id,
    },
  })

  const locationIds = vendorLocationLinks
    .map((link) => link[Modules.STOCK_LOCATION]?.stock_location_id)
    .filter(Boolean)

  // Get all inventory items for vendor's products
  const productIds = vendor.products.map((p: any) => p.id)
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
      inventory: [],
      locations: [],
    })
  }

  // Get inventory levels for these items
  const inventoryLevels = await inventoryModuleService.listInventoryLevels({
    inventory_item_id: inventoryItemIds,
    location_id: locationIds.length > 0 ? locationIds : undefined,
  })

  // Get stock locations
  const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
  const locations = locationIds.length > 0
    ? await stockLocationModuleService.listStockLocations({
        id: locationIds,
      })
    : []

  // Format response with product/variant information
  const inventory = await Promise.all(
    inventoryLevels.map(async (level) => {
      // Find the inventory item link to get variant info
      const itemLink = inventoryItemLinks.find(
        (link) => link[Modules.INVENTORY]?.inventory_item_id === level.inventory_item_id
      )
      
      const variantId = itemLink?.[Modules.PRODUCT]?.variant_id
      const variant = vendor.products
        .flatMap((p: any) => p.variants || [])
        .find((v: any) => v.id === variantId)

      const location = locations.find((loc) => loc.id === level.location_id)

      return {
        inventory_item_id: level.inventory_item_id,
        location_id: level.location_id,
        location_name: location?.name,
        stocked_quantity: level.stocked_quantity,
        reserved_quantity: level.reserved_quantity,
        available_quantity: level.stocked_quantity - level.reserved_quantity,
        variant_id: variantId,
        variant: variant ? {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
        } : null,
        product: variant ? vendor.products.find((p: any) => 
          p.variants?.some((v: any) => v.id === variantId)
        ) : null,
      }
    })
  )

  res.json({
    inventory,
    locations: locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
    })),
  })
}

