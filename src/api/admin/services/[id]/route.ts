import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"

// GET single service
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params

  try {
    const service = await bookingModuleService.retrieveService(id)
    res.json({ service })
  } catch (error) {
    res.status(404).json({ error: "Service not found" })
  }
}

// PUT update service
export const PUT = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params

  // Debug logging
  console.log("PUT /admin/services/[id] - Request params:", req.params)
  console.log("PUT /admin/services/[id] - ID:", id)
  console.log("PUT /admin/services/[id] - Request body:", req.body)

  // Validate ID
  if (!id || id === "") {
    console.error("PUT /admin/services/[id] - Empty ID received")
    return res.status(400).json({
      error: "Service ID is required",
      received_id: id,
      params: req.params
    })
  }

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

  try {
    // First verify the service exists
    const existingService = await bookingModuleService.retrieveService(id)
    if (!existingService) {
      return res.status(404).json({ error: `Service with id "${id}" not found` })
    }

    console.log("PUT /admin/services/[id] - Existing service found:", existingService.name)

    // Update the service
    const service = await bookingModuleService.updateServices(id as any, {
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
      updated_at: new Date(),
    } as any)

    console.log("PUT /admin/services/[id] - Service updated successfully")
    res.json({ service })
  } catch (error) {
    console.error("PUT /admin/services/[id] - Error:", error)
    res.status(400).json({ error: (error as Error).message })
  }
}

// DELETE service (soft delete)
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params

  try {
    await bookingModuleService.deleteServices(id)
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

