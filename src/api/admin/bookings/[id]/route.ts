import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const booking = await bookingModuleService.retrieveBooking(id)
    
    res.json({
      booking
    })
  } catch (error) {
    console.error("Error fetching booking:", error)
    res.status(500).json({
      error: "Failed to fetch booking"
    })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const bookingData = req.body as any
    
    const booking = await bookingModuleService.updateBookings({
      id,
      ...bookingData
    })
    
    res.json({
      booking
    })
  } catch (error) {
    console.error("Error updating booking:", error)
    res.status(500).json({
      error: "Failed to update booking"
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    await bookingModuleService.deleteBookings(id)
    
    res.status(204).send()
  } catch (error) {
    console.error("Error deleting booking:", error)
    res.status(500).json({
      error: "Failed to delete booking"
    })
  }
}
