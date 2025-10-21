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
    const booking = await bookingModuleService.retrieveBooking(id)
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    if (booking.status === "confirmed") {
      return res.status(400).json({ error: "Booking is already confirmed" })
    }

    if (booking.service_price > 0 && !booking.payment_paid) {
      return res.status(400).json({ 
        error: "Cannot confirm booking without payment" 
      })
    }

    await bookingModuleService.updateBookings({
      id,
      status: "confirmed",
    })

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

