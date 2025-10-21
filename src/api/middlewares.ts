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
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Log the request for debugging
  const path = req.path || req.url
  const publishableKey = req.headers["x-publishable-api-key"]

  console.log(`[Middleware] ${req.method} ${path}`)
  console.log(`[Middleware] Publishable Key Header: ${publishableKey ? "Present" : "Missing"}`)

  // For our custom routes, we'll handle the request directly
  if (path?.includes('/store/services') || path?.includes('/store/bookings')) {
    // Import the booking module service and handle the request
    try {
      const { BOOKING_MODULE } = await import("../modules/booking/index.js")
      const BookingModuleService = (await import("../modules/booking/service.js")).default
      
      const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as any
      
      if (path?.includes('/store/services')) {
        const services = await bookingModuleService.listServices()
        res.json({ services: services || [] })
        return
      }
      
      if (path?.includes('/store/bookings')) {
        if (req.method === 'GET') {
          const bookings = await bookingModuleService.listBookings()
          res.json({ bookings: bookings || [] })
          return
        } else if (req.method === 'POST') {
          // Handle booking updates
          // Extract ID from path like /store/bookings/123
          const pathParts = path.split('/')
          const id = pathParts[pathParts.length - 1]
          if (id && id !== 'bookings') {
            const booking = await bookingModuleService.updateBookings(id as any, {
              ...(req.body as any),
              updated_at: new Date(),
            } as any)
            res.json({ booking })
            return
          }
        }
      }
    } catch (error) {
      console.error("Error in custom middleware:", error)
      res.status(500).json({ error: "Internal server error" })
      return
    }
  }

  // For other routes, just pass through
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
      matcher: "/store/session-times*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/admin/bookings*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/admin/services*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/admin/session-times*",
      middlewares: [allowCustomStoreRoutes],
    },
    {
      matcher: "/webhooks/stripe",
      bodyParser: false,
      middlewares: [rawBodyMiddleware],
    },
  ],
})

