import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import { sendBookingCancellation } from "@modules/notification/email-service"

// GET single booking (admin)
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params

  try {
    const booking = await bookingModuleService.retrieveBooking(id)
    res.json({ booking })
  } catch (error) {
    res.status(404).json({ error: "Booking not found" })
  }
}

// DELETE cancel booking (admin)
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params
  const { reason } = req.body as { reason?: string }

  try {
    // Get booking before cancellation
    const booking = await bookingModuleService.retrieveBooking(id)

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    // Update booking status to cancelled
    await bookingModuleService.updateBookings({
      id: id,
      status: "cancelled",
      notes: reason ? `Cancelled by admin: ${reason}` : booking.notes,
      updated_at: new Date(),
    } as any)

    // Send cancellation email
    try {
      await sendBookingCancellation(booking)
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError)
      // Don't fail the request if email fails
    }

    res.json({ 
      success: true,
      message: "Booking cancelled successfully" 
    })
  } catch (error) {
    console.error("Admin booking cancellation error:", error)
    res.status(400).json({ 
      error: "Failed to cancel booking", 
      details: (error as Error).message 
    })
  }
}
