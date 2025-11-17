import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows"
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
  const startDate = req.query.start_date as string | undefined
  const endDate = req.query.end_date as string | undefined
  const locationId = req.query.location_id as string | undefined
  const groupBy = (req.query.group_by as string) || "day" // day, week, month, product, location

  // Get vendor's orders
  const { data: [vendor] } = await query.graph({
    entity: "vendor",
    fields: ["orders.*"],
    filters: {
      id: [vendorAdmin.vendor.id],
    },
  })

  if (!vendor || !vendor.orders || vendor.orders.length === 0) {
    return res.json({
      summary: {
        total_revenue: 0,
        total_orders: 0,
        total_items_sold: 0,
        average_order_value: 0,
      },
      data: [],
      by_location: [],
      by_product: [],
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

  // Get detailed orders
  const { result: orders } = await getOrdersListWorkflow(req.scope).run({
    input: {
      fields: [
        "id",
        "created_at",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "items.*",
        "items.variant",
        "items.variant.product",
        "fulfillments.*",
        "fulfillments.location_id",
      ],
      variables: {
        filters: {
          id: vendor.orders.map((order: any) => order.id),
          ...(startDate || endDate ? {
            created_at: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          } : {}),
        },
      },
    },
  })

  // Calculate summary statistics
  let totalRevenue = 0
  let totalItemsSold = 0
  const productSales: Record<string, any> = {}
  const locationSales: Record<string, any> = {}
  const timeSeriesData: Record<string, any> = {}

  orders.forEach((order: any) => {
    totalRevenue += Number(order.total) || 0

    order.items?.forEach((item: any) => {
      totalItemsSold += item.quantity || 0

      // Track by product
      const productId = item.variant?.product?.id || "unknown"
      if (!productSales[productId]) {
        productSales[productId] = {
          product_id: productId,
          product_title: item.variant?.product?.title || "Unknown",
          quantity_sold: 0,
          revenue: 0,
        }
      }
      productSales[productId].quantity_sold += item.quantity || 0
      productSales[productId].revenue += (item.unit_price || 0) * (item.quantity || 0)

      // Track by location (from fulfillments)
      const fulfillment = order.fulfillments?.[0]
      const fulfillmentLocationId = fulfillment?.location_id || "unknown"
      if (!locationSales[fulfillmentLocationId]) {
        locationSales[fulfillmentLocationId] = {
          location_id: fulfillmentLocationId,
          quantity_sold: 0,
          revenue: 0,
        }
      }
      locationSales[fulfillmentLocationId].quantity_sold += item.quantity || 0
      locationSales[fulfillmentLocationId].revenue += (item.unit_price || 0) * (item.quantity || 0)
    })

    // Track by time period
    const orderDate = new Date(order.created_at)
    let timeKey = ""
    
    if (groupBy === "day") {
      timeKey = orderDate.toISOString().split("T")[0]
    } else if (groupBy === "week") {
      const weekStart = new Date(orderDate)
      weekStart.setDate(orderDate.getDate() - orderDate.getDay())
      timeKey = weekStart.toISOString().split("T")[0]
    } else if (groupBy === "month") {
      timeKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`
    }

    if (timeKey) {
      if (!timeSeriesData[timeKey]) {
        timeSeriesData[timeKey] = {
          period: timeKey,
          revenue: 0,
          orders: 0,
          items_sold: 0,
        }
      }
      timeSeriesData[timeKey].revenue += Number(order.total) || 0
      timeSeriesData[timeKey].orders += 1
      timeSeriesData[timeKey].items_sold += order.items?.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      ) || 0
    }
  })

  // Get location names
  const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
  const locations = vendorLocationIds.length > 0
    ? await stockLocationModuleService.listStockLocations({
        id: vendorLocationIds,
      })
    : []

  const locationSalesWithNames = Object.values(locationSales).map((loc: any) => ({
    ...loc,
    location_name: locations.find((l) => l.id === loc.location_id)?.name || "Unknown",
  }))

  // Filter by location if specified
  const filteredLocationSales = locationId
    ? locationSalesWithNames.filter((loc: any) => loc.location_id === locationId)
    : locationSalesWithNames

  res.json({
    summary: {
      total_revenue: totalRevenue,
      total_orders: orders.length,
      total_items_sold: totalItemsSold,
      average_order_value: orders.length > 0 ? totalRevenue / orders.length : 0,
    },
    data: Object.values(timeSeriesData).sort((a: any, b: any) => 
      a.period.localeCompare(b.period)
    ),
    by_location: filteredLocationSales,
    by_product: Object.values(productSales).sort((a: any, b: any) => 
      b.revenue - a.revenue
    ),
  })
}

