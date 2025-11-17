import { 
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { 
  AdminCreateProduct,
} from "@medusajs/medusa/api/admin/products/validators"
import { instantdbVendorAuthMiddleware } from "../middlewares/instantdb-auth"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/vendors/products",
      method: "POST",
      middlewares: [
        instantdbVendorAuthMiddleware,
        validateAndTransformBody(AdminCreateProduct),
      ],
    },
    {
      matcher: "/vendors/orders",
      method: "GET",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
    {
      matcher: "/vendors/inventory",
      method: "GET",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
    {
      matcher: "/vendors/inventory/transfer",
      method: "POST",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
    {
      matcher: "/vendors/inventory/alerts",
      method: "GET",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
    {
      matcher: "/vendors/inventory/history",
      method: "GET",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
    {
      matcher: "/vendors/reports/*",
      method: "GET",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
    {
      matcher: "/vendors/upload",
      method: "POST",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
    {
      matcher: "/admin/orders/*",
      method: "POST",
      middlewares: [
        instantdbVendorAuthMiddleware,
      ],
    },
  ],
})
