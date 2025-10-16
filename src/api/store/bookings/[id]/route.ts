import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import { sendBookingCancellation } from "@modules/notification/email-service"

// GET single booking
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

// PATCH update booking
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params

  try {
    const booking = await bookingModuleService.updateBookings(id as any, {
      ...(req.body as any),
      updated_at: new Date(),
    } as any)

    res.json({ booking })
  } catch (error) {
    res.status(400).json({ error: "Failed to update booking" })
  }
}

// DELETE cancel booking
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params

  try {
    // Get booking before cancellation
    const booking = await bookingModuleService.retrieveBooking(id)

    await bookingModuleService.updateBookings(id as any, {
      status: "cancelled",
      updated_at: new Date(),
    } as any)

    // Send cancellation email
    try {
      await sendBookingCancellation(booking)
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError)
    }

    res.json({ message: "Booking cancelled successfully" })
  } catch (error) {
    res.status(400).json({ error: "Failed to cancel booking" })
  }
}
