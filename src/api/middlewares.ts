import { defineMiddlewares } from "@medusajs/framework/http"
import { raw } from "body-parser"
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"

/**
 * Middleware to allow custom store routes to work without publishable key validation
 * The publishable key is sent by the frontend but we don't need to validate it
 * for our custom booking module routes
 */
async function allowCustomStoreRoutes(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Log the request for debugging
  const path = req.path || req.url
  const publishableKey = req.headers["x-publishable-api-key"]

  console.log(`[Middleware] ${req.method} ${path}`)
  console.log(`[Middleware] Publishable Key Header: ${publishableKey ? "Present" : "Missing"}`)

  // Just pass through - no validation needed for custom routes
  next()
}

/**
 * Middleware to preserve raw body for Stripe webhook signature verification
 */
const rawBodyMiddleware = raw({ type: "application/json" })

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/services*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/store/bookings*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/store/availability*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/store/payments*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/webhooks/stripe",
      bodyParser: false,
      middlewares: [rawBodyMiddleware],
    },
  ],
})

