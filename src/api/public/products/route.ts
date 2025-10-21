import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// Public products API - database-driven
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    // Get all services as products
    const services = await bookingModuleService.listServices({})
    
    // Transform services to product format
    const products = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category || "Services",
      price: service.price,
      sku: `SVC-${service.id}`,
      stock: 999, // Services have unlimited stock
      image_url: service.image_url,
      ingredients: [],
      skinTypes: ["All"],
      concerns: [],
      rating: 4.5,
      reviews: 0,
      is_active: service.is_active,
      created_at: service.created_at
    }))
    
    res.json({ products })
  } catch (error: any) {
    console.error("Error fetching products:", error)
    res.status(500).json({ error: error.message || "Failed to fetch products" })
  }
}
