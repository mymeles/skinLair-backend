import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
  const { id } = req.params

  try {
    // Get the booking
    const booking = await bookingModuleService.retrieveBooking(id)
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    // Check if booking is already confirmed
    if (booking.status === "confirmed") {
      return res.status(400).json({ error: "Booking is already confirmed" })
    }

    // Check if payment is required but not paid
    if (booking.service_price > 0 && !booking.payment_paid) {
      return res.status(400).json({ 
        error: "Cannot confirm booking without payment. Payment is required." 
      })
    }

    // Update booking status to confirmed
    await bookingModuleService.updateBookings({
      id,
      status: "confirmed",
    })

    // Get updated booking
    const updatedBooking = await bookingModuleService.retrieveBooking(id)

    res.json({ 
      success: true, 
      booking: updatedBooking,
      message: "Booking confirmed successfully"
    })
  } catch (error: any) {
    console.error("Error confirming booking:", error)
    res.status(500).json({ error: error.message || "Failed to confirm booking" })
  }
}
