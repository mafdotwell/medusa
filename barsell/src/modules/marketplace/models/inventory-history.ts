import { model } from "@medusajs/framework/utils"

const InventoryHistory = model.define("inventory_history", {
  id: model.id().primaryKey(),
  inventory_item_id: model.text(),
  location_id: model.text(),
  vendor_id: model.text(),
  change_type: model.text(), // 'transfer', 'sale', 'adjustment', 'restock', 'return'
  quantity_change: model.number(), // positive for increase, negative for decrease
  quantity_before: model.number(),
  quantity_after: model.number(),
  reference_type: model.text().nullable(), // 'order', 'transfer', 'adjustment', etc.
  reference_id: model.text().nullable(),
  notes: model.text().nullable(),
  created_by: model.text().nullable(), // user/vendor admin ID
})

export default InventoryHistory

