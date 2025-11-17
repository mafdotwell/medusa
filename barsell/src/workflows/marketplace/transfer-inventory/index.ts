import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/framework/workflows-sdk"
import transferInventoryStep from "./steps/transfer-inventory"

type WorkflowInput = {
  inventory_item_id: string
  from_location_id: string
  to_location_id: string
  quantity: number
  vendor_id: string
  reference?: string
  reference_id?: string
}

const transferInventoryWorkflow = createWorkflow(
  "transfer-inventory",
  (input: WorkflowInput) => {
    // Verify inventory levels exist
    const { data: inventoryLevels } = useQueryGraphStep({
      entity: "inventory_level",
      fields: ["id", "stocked_quantity", "reserved_quantity", "location_id", "inventory_item_id"],
      filters: {
        inventory_item_id: [input.inventory_item_id],
        location_id: [input.from_location_id, input.to_location_id],
      },
    })

    const result = transferInventoryStep({
      inventory_item_id: input.inventory_item_id,
      from_location_id: input.from_location_id,
      to_location_id: input.to_location_id,
      quantity: input.quantity,
      vendor_id: input.vendor_id,
      reference: input.reference,
      reference_id: input.reference_id,
      existing_levels: inventoryLevels,
    })

    return new WorkflowResponse(result)
  }
)

export default transferInventoryWorkflow

