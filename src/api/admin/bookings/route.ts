import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const bookings = await bookingModuleService.listBookings()
    
    res.json({
      bookings: bookings || []
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    res.status(500).json({
      error: "Failed to fetch bookings"
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const bookingData = req.body as any
    
    const booking = await bookingModuleService.createBookings(bookingData)
    
    res.status(201).json({
      booking
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    res.status(500).json({
      error: "Failed to create booking"
    })
  }
}