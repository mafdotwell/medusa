import { Module } from "@medusajs/framework/utils"
import MarketplaceModuleService from "./service"
import InventoryHistory from "./models/inventory-history"

export const MARKETPLACE_MODULE = "marketplaceModuleService"

export default Module(MARKETPLACE_MODULE, {
  service: MarketplaceModuleService,
  models: [InventoryHistory],
})