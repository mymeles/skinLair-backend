import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// Database-driven products management
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    const { name, description, category, price, image_url, is_active } = req.body as any
    
    // Create a new service (which acts as a product)
    const service = await bookingModuleService.createServices({
      name,
      description,
      category,
      price: Math.round(price * 100), // Convert to cents
      image_url,
      duration: 60, // Default duration
      is_active: is_active !== false,
      buffer_time: 0,
      max_advance_booking: 90
    })
    
    res.json({ message: "Product created successfully", product: service })
  } catch (error: any) {
    console.error("Error creating product:", error)
    res.status(500).json({ error: error.message || "Failed to create product" })
  }
}
