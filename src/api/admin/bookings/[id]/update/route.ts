import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const bookingData = req.body as any
    
    const booking = await bookingModuleService.updateBookings({
      id,
      ...bookingData,
      updated_at: new Date(),
    })
    
    res.json({
      success: true,
      booking
    })
  } catch (error) {
    console.error("Error updating booking:", error)
    res.status(500).json({
      error: "Failed to update booking"
    })
  }
}
