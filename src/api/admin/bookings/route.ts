import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"

// Admin endpoints for managing bookings

// GET all bookings (admin view with more details)
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const { status, date_from, date_to, staff_id } = req.query

  const filters: any = {}
  
  if (status) {
    filters.status = status
  }

  if (staff_id) {
    filters.staff_id = staff_id
  }

  if (date_from || date_to) {
    filters.scheduled_date = {}
    if (date_from) {
      filters.scheduled_date.$gte = new Date(date_from as string)
    }
    if (date_to) {
      filters.scheduled_date.$lte = new Date(date_to as string)
    }
  }

  const bookings = await bookingModuleService.listBookings(filters, {
    order: { scheduled_date: "ASC" }
  })

  // Get statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b: any) => b.status === 'pending').length,
    confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
    cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
    completed: bookings.filter((b: any) => b.status === 'completed').length,
  }

  res.json({ bookings, stats })
}
