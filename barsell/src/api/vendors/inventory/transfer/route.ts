import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import transferInventoryWorkflow from "../../../../workflows/marketplace/transfer-inventory"

const schema = z.object({
  inventory_item_id: z.string(),
  from_location_id: z.string(),
  to_location_id: z.string(),
  quantity: z.number().positive(),
  reference: z.string().optional(),
  reference_id: z.string().optional(),
}).strict()

type RequestBody = z.infer<typeof schema>

export const POST = async (
  req: AuthenticatedMedusaRequest<RequestBody>,
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

  const input = schema.parse(req.body)

  // Verify vendor has access to both locations
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const vendorLocationLinks = await link.list({
    [MARKETPLACE_MODULE]: {
      vendor_id: vendorAdmin.vendor.id,
    },
  })

  const vendorLocationIds = vendorLocationLinks
    .map((link) => link[Modules.STOCK_LOCATION]?.stock_location_id)
    .filter(Boolean)

  if (
    !vendorLocationIds.includes(input.from_location_id) ||
    !vendorLocationIds.includes(input.to_location_id)
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You don't have access to one or both of these locations"
    )
  }

  // Execute transfer workflow
  const { result } = await transferInventoryWorkflow(req.scope).run({
    input: {
      ...input,
      vendor_id: vendorAdmin.vendor.id,
    },
  })

  res.json({
    transfer: result,
  })
}

