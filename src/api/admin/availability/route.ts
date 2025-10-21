import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// Admin endpoints for managing availability

// GET all availability rules
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const { staff_id, day_of_week } = req.query

  const filters: any = {}
  
  if (staff_id) {
    filters.staff_id = staff_id
  }
  
  if (day_of_week !== undefined) {
    filters.day_of_week = parseInt(day_of_week as string)
  }

  const availabilities = await bookingModuleService.listAvailabilities(filters, {
    order: { day_of_week: "ASC", start_time: "ASC" }
  })

  res.json({ availabilities })
}

// POST create availability rule
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const {
    staff_id,
    staff_name,
    day_of_week,
    start_time,
    end_time,
    is_available,
  } = req.body as {
    staff_id?: string
    staff_name?: string
    day_of_week?: number
    start_time?: string
    end_time?: string
    is_available?: boolean
  }

  if (day_of_week === undefined || !start_time || !end_time) {
    return res.status(400).json({
      error: "Missing required fields: day_of_week, start_time, end_time"
    })
  }

  const availability = await bookingModuleService.createAvailabilities({
    staff_id,
    staff_name,
    day_of_week,
    start_time,
    end_time,
    is_available: is_available !== undefined ? is_available : true,
  })

  res.status(201).json({ availability })
}
