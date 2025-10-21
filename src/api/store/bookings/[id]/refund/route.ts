import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
  const { id } = req.params
  const { reason } = req.body as { reason?: string }

  try {
    const booking = await bookingModuleService.retrieveBooking(id)
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" })
    }

    if (!booking.payment_paid) {
      return res.status(400).json({ error: "No payment to refund" })
    }

    const payments = await bookingModuleService.listPayments({
      booking_id: id,
      status: "succeeded"
    })

    if (payments.length === 0) {
      return res.status(400).json({ error: "No successful payment found" })
    }

    const payment = payments[0]

    await bookingModuleService.updateBookings({
      id,
      status: "cancelled",
      refund_amount: booking.service_price,
      refund_reason: reason || "Admin refund",
    })

    await bookingModuleService.updatePayments({
      id: payment.id,
      status: "refunded",
      refund_amount: booking.service_price,
      refund_reason: reason || "Admin refund",
    })

    const updatedBooking = await bookingModuleService.retrieveBooking(id)

    res.json({ 
      success: true, 
      booking: updatedBooking,
      refund_amount: booking.service_price,
      message: "Refund processed successfully"
    })
  } catch (error: any) {
    console.error("Error processing refund:", error)
    res.status(500).json({ error: error.message || "Failed to process refund" })
  }
}

