import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"

// GET all services
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
  } else {
    filters.is_active = true // Only show active services by default
  }

  const services = await bookingModuleService.listServices(filters, {
    order: { name: "ASC" }
  })

  res.json({ services })
}

// POST create new service (admin only - you might want to move to admin API)
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
    deposit_required?: boolean
    deposit_amount?: number
    buffer_time?: number
    max_advance_booking?: number
  }

  if (!name || !duration || !price) {
    return res.status(400).json({
      error: "Missing required fields: name, duration, price"
    })
  }

  const service = await bookingModuleService.createServices({
    name,
    description,
    duration,
    price,
    category,
    image_url,
    is_active: true,
    deposit_required: deposit_required || false,
    deposit_amount,
    buffer_time: buffer_time || 0,
    max_advance_booking: max_advance_booking || 90,
  })

  res.status(201).json({ service })
}
