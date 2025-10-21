import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
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
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    const body = req.body as any
    const { id, ...updateData } = body
    
    if (!id) {
      return res.status(400).json({ error: "Booking ID is required" })
    }
    
    const booking = await bookingModuleService.updateBookings({
      id,
      ...updateData,
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
