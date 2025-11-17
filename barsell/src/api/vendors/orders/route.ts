import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows"
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

  const { data: [vendor] } = await query.graph({
    entity: "vendor",
    fields: ["orders.*"],
    filters: {
      id: [vendorAdmin.vendor.id],
    },
  })

  const { result: orders } = await getOrdersListWorkflow(req.scope)
    .run({
      input: {
        fields: [
          "metadata",
          "total",
          "subtotal",
          "shipping_total",
          "tax_total",
          "items.*",
          "items.tax_lines",
          "items.adjustments",
          "items.variant",
          "items.variant.product",
          "items.detail",
          "shipping_methods",
          "payment_collections",
          "fulfillments",
          "fulfillments.location_id",
        ],
        variables: {
          filters: {
            id: vendor.orders.map((order) => order.id),
          },
        },
      },
    })

  // Get vendor's stock locations for context
  const vendorLocationLinks = await link.list({
    [MARKETPLACE_MODULE]: {
      vendor_id: vendorAdmin.vendor.id,
    },
  })

  const vendorLocationIds = vendorLocationLinks
    .map((link) => link[Modules.STOCK_LOCATION]?.stock_location_id)
    .filter(Boolean)

  const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
  const locations = vendorLocationIds.length > 0
    ? await stockLocationModuleService.listStockLocations({
        id: vendorLocationIds,
      })
    : []

  // Enhance orders with inventory and location information
  const enrichedOrders = await Promise.all(
    orders.map(async (order: any) => {
      const enrichedItems = await Promise.all(
        (order.items || []).map(async (item: any) => {
          // Get current inventory for this variant
          const variantId = item.variant?.id
          if (!variantId) {
            return {
              ...item,
              inventory: null,
            }
          }

          // Get inventory item link
          const inventoryItemLinks = await link.list({
            [Modules.PRODUCT]: {
              variant_id: [variantId],
            },
          })

          const inventoryItemId = inventoryItemLinks[0]?.[Modules.INVENTORY]?.inventory_item_id

          if (!inventoryItemId) {
            return {
              ...item,
              inventory: null,
            }
          }

          // Get inventory levels for vendor locations
          const inventoryLevels = vendorLocationIds.length > 0
            ? await inventoryModuleService.listInventoryLevels({
                inventory_item_id: [inventoryItemId],
                location_id: vendorLocationIds,
              })
            : []

          return {
            ...item,
            inventory: {
              levels: inventoryLevels.map((level) => ({
                location_id: level.location_id,
                location_name: locations.find((l) => l.id === level.location_id)?.name,
                stocked_quantity: level.stocked_quantity,
                reserved_quantity: level.reserved_quantity,
                available_quantity: level.stocked_quantity - level.reserved_quantity,
              })),
              total_available: inventoryLevels.reduce(
                (sum, level) => sum + (level.stocked_quantity - level.reserved_quantity),
                0
              ),
            },
          }
        })
      )

      // Get fulfillment location
      const fulfillmentLocationId = order.fulfillments?.[0]?.location_id
      const fulfillmentLocation = fulfillmentLocationId
        ? locations.find((l) => l.id === fulfillmentLocationId)
        : null

      return {
        ...order,
        items: enrichedItems,
        fulfillment_location: fulfillmentLocation ? {
          id: fulfillmentLocation.id,
          name: fulfillmentLocation.name,
          address: fulfillmentLocation.address,
        } : null,
      }
    })
  )

  res.json({
    orders: enrichedOrders,
    locations: locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
    })),
  })
}