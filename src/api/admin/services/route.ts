import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"

// GET all services (admin view - includes inactive)
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const { category, is_active } = req.query

  const filters: any = {}
  
  if (category) {
    filters.category = category
  }
  
  if (is_active !== undefined) {
    filters.is_active = is_active === 'true'
  }

  const services = await bookingModuleService.listServices(filters, {
    order: { name: "ASC" }
  })

  res.json({ services })
}

// POST create new service
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const {
    name,
    description,
    duration,
    price,
    category,
    image_url,
    is_active,
    deposit_required,
    deposit_amount,
    buffer_time,
    max_advance_booking,
  } = req.body as {
    name?: string
    description?: string
    duration?: number
    price?: number
    category?: string
    image_url?: string
    is_active?: boolean
    deposit_required?: boolean
    deposit_amount?: number
    buffer_time?: number
    max_advance_booking?: number
  }

  if (!name || duration === undefined || price === undefined) {
    return res.status(400).json({
      error: "Missing required fields: name, duration, price",
      received: { name, duration, price }
    })
  }

  try {
    const service = await bookingModuleService.createServices({
      name,
      description: description || undefined,
      duration,
      price,
      category: category || undefined,
      image_url: image_url || undefined,
      is_active: is_active !== undefined ? is_active : true,
      deposit_required: deposit_required || false,
      deposit_amount: deposit_amount || undefined,
      buffer_time: buffer_time || 0,
      max_advance_booking: max_advance_booking || 90,
    })

    res.status(201).json({ service })
  } catch (error) {
    console.error("Service creation error:", error)
    res.status(400).json({ error: (error as Error).message })
  }
}

