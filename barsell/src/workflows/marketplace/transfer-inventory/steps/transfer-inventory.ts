import { 
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { 
  Modules,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import { 
  IInventoryModuleService,
} from "@medusajs/framework/types"
import { 
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"

type StepInput = {
  inventory_item_id: string
  from_location_id: string
  to_location_id: string
  quantity: number
  vendor_id: string
  reference?: string
  reference_id?: string
  existing_levels: any[]
}

const transferInventoryStep = createStep(
  "transfer-inventory",
  async (
    input: StepInput,
    { container }
  ) => {
    const inventoryModuleService = container.resolve<IInventoryModuleService>(
      Modules.INVENTORY
    )

    // Find existing levels
    const fromLevel = input.existing_levels.find(
      (level) => 
        level.inventory_item_id === input.inventory_item_id &&
        level.location_id === input.from_location_id
    )

    const toLevel = input.existing_levels.find(
      (level) => 
        level.inventory_item_id === input.inventory_item_id &&
        level.location_id === input.to_location_id
    )

    // Check if source has enough inventory
    if (!fromLevel || fromLevel.stocked_quantity - fromLevel.reserved_quantity < input.quantity) {
      throw new Error(
        `Insufficient inventory at source location. Available: ${
          fromLevel ? fromLevel.stocked_quantity - fromLevel.reserved_quantity : 0
        }, Requested: ${input.quantity}`
      )
    }

    // Update source location (decrease)
    await updateInventoryLevelsWorkflow(container).run({
      input: {
        updates: [
          {
            id: fromLevel.id,
            stocked_quantity: fromLevel.stocked_quantity - input.quantity,
          },
        ],
      },
    })

    // Update or create destination location (increase)
    if (toLevel) {
      await updateInventoryLevelsWorkflow(container).run({
        input: {
          updates: [
            {
              id: toLevel.id,
              stocked_quantity: toLevel.stocked_quantity + input.quantity,
            },
          ],
        },
      })
    } else {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: [
            {
              inventory_item_id: input.inventory_item_id,
              location_id: input.to_location_id,
              stocked_quantity: input.quantity,
            },
          ],
        },
      })
    }

    // Get updated levels
    const updatedFromLevel = await inventoryModuleService.retrieveInventoryLevel(
      fromLevel.id
    )

    const updatedToLevel = toLevel
      ? await inventoryModuleService.retrieveInventoryLevel(toLevel.id)
      : await inventoryModuleService.listInventoryLevels({
          inventory_item_id: [input.inventory_item_id],
          location_id: [input.to_location_id],
        }).then((levels) => levels[0])

    // Create inventory history records for audit trail
    const marketplaceService = container.resolve<MarketplaceModuleService>(
      MARKETPLACE_MODULE
    )

    // History for source location (decrease)
    await marketplaceService.createInventoryHistory({
      inventory_item_id: input.inventory_item_id,
      location_id: input.from_location_id,
      vendor_id: input.vendor_id,
      change_type: "transfer",
      quantity_change: -input.quantity,
      quantity_before: fromLevel.stocked_quantity,
      quantity_after: updatedFromLevel.stocked_quantity,
      reference_type: "transfer",
      reference_id: input.reference_id,
      notes: `Transferred ${input.quantity} units to location ${input.to_location_id}`,
    })

    // History for destination location (increase)
    await marketplaceService.createInventoryHistory({
      inventory_item_id: input.inventory_item_id,
      location_id: input.to_location_id,
      vendor_id: input.vendor_id,
      change_type: "transfer",
      quantity_change: input.quantity,
      quantity_before: toLevel?.stocked_quantity || 0,
      quantity_after: updatedToLevel.stocked_quantity,
      reference_type: "transfer",
      reference_id: input.reference_id,
      notes: `Received ${input.quantity} units from location ${input.from_location_id}`,
    })

    return new StepResponse({
      transfer: {
        id: `transfer_${Date.now()}`,
        inventory_item_id: input.inventory_item_id,
        from_location_id: input.from_location_id,
        to_location_id: input.to_location_id,
        quantity: input.quantity,
        from_level: updatedFromLevel,
        to_level: updatedToLevel,
        reference: input.reference,
        reference_id: input.reference_id,
        created_at: new Date(),
      },
    })
  },
  async (input, { container }) => {
    // Rollback: reverse the transfer
    const inventoryModuleService = container.resolve<IInventoryModuleService>(
      Modules.INVENTORY
    )

    const fromLevel = input.existing_levels.find(
      (level) => 
        level.inventory_item_id === input.inventory_item_id &&
        level.location_id === input.from_location_id
    )

    const toLevel = input.existing_levels.find(
      (level) => 
        level.inventory_item_id === input.inventory_item_id &&
        level.location_id === input.to_location_id
    )

    if (fromLevel) {
      await updateInventoryLevelsWorkflow(container).run({
        input: {
          updates: [
            {
              id: fromLevel.id,
              stocked_quantity: fromLevel.stocked_quantity,
            },
          ],
        },
      })
    }

    if (toLevel) {
      const currentToLevel = await inventoryModuleService.listInventoryLevels({
        inventory_item_id: [input.inventory_item_id],
        location_id: [input.to_location_id],
      }).then((levels) => levels[0])

      if (currentToLevel) {
        await updateInventoryLevelsWorkflow(container).run({
          input: {
            updates: [
              {
                id: currentToLevel.id,
                stocked_quantity: Math.max(0, currentToLevel.stocked_quantity - input.quantity),
              },
            ],
          },
        })
      }
    }

    return new StepResponse({})
  }
)

export default transferInventoryStep

