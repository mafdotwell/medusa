import { MedusaService } from "@medusajs/framework/utils"
import Vendor from "./models/vendor"
import VendorAdmin from "./models/vendor-admin"
import InventoryHistory from "./models/inventory-history"

class MarketplaceModuleService extends MedusaService({
  Vendor,
  VendorAdmin,
  InventoryHistory,
}) {
  /**
   * Create inventory history record for audit trail
   */
  async createInventoryHistory(data: {
    inventory_item_id: string
    location_id: string
    vendor_id: string
    change_type: "transfer" | "sale" | "adjustment" | "restock" | "return"
    quantity_change: number
    quantity_before: number
    quantity_after: number
    reference_type?: string
    reference_id?: string
    notes?: string
    created_by?: string
  }) {
    return await this.createInventoryHistories(data)
  }

  /**
   * Get inventory history for a vendor
   */
  async getInventoryHistory(filters: {
    vendor_id?: string
    inventory_item_id?: string
    location_id?: string
    change_type?: string
    start_date?: Date
    end_date?: Date
  }) {
    const query: any = {}
    
    if (filters.vendor_id) {
      query.vendor_id = filters.vendor_id
    }
    if (filters.inventory_item_id) {
      query.inventory_item_id = filters.inventory_item_id
    }
    if (filters.location_id) {
      query.location_id = filters.location_id
    }
    if (filters.change_type) {
      query.change_type = filters.change_type
    }

    const histories = await this.listInventoryHistories(query)

    // Filter by date range if provided
    let filtered = histories
    if (filters.start_date || filters.end_date) {
      filtered = histories.filter((history) => {
        const createdAt = new Date(history.created_at)
        if (filters.start_date && createdAt < filters.start_date) {
          return false
        }
        if (filters.end_date && createdAt > filters.end_date) {
          return false
        }
        return true
      })
    }

    return filtered
  }
}

export default MarketplaceModuleService