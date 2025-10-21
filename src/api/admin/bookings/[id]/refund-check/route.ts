import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export const GET = async (
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

    // Check if booking can be refunded
    if (booking.status === "cancelled") {
      return res.status(400).json({ 
        error: "Booking is already cancelled",
        can_refund: false 
      })
    }

    if (!booking.payment_paid) {
      return res.status(400).json({ 
        error: "No payment to refund",
        can_refund: false 
      })
    }

    // Calculate refund eligibility based on 24-hour policy
    const now = new Date()
    const bookingDate = new Date(booking.scheduled_date)
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    let refundAmount = 0
    let refundPolicy = ""
    let canRefund = true
    
    if (hoursUntilBooking >= 24) {
      // Full refund if cancelled 24+ hours before
      refundAmount = booking.service_price
      refundPolicy = "Full refund (cancelled 24+ hours before appointment)"
    } else if (hoursUntilBooking >= 12) {
      // 50% refund if cancelled 12-24 hours before
      refundAmount = booking.service_price * 0.5
      refundPolicy = "50% refund (cancelled 12-24 hours before appointment)"
    } else if (hoursUntilBooking >= 2) {
      // 25% refund if cancelled 2-12 hours before
      refundAmount = booking.service_price * 0.25
      refundPolicy = "25% refund (cancelled 2-12 hours before appointment)"
    } else {
      // No refund if cancelled less than 2 hours before
      refundAmount = 0
      refundPolicy = "No refund (cancelled less than 2 hours before appointment)"
      canRefund = false
    }

    // Check if payment exists
    const payments = await bookingModuleService.listPayments({
      booking_id: id,
      status: "succeeded"
    })

    if (payments.length === 0) {
      return res.status(400).json({ 
        error: "No successful payment found for this booking",
        can_refund: false 
      })
    }

    res.json({
      can_refund: canRefund,
      refund_amount: refundAmount,
      refund_policy: refundPolicy,
      hours_until_booking: Math.round(hoursUntilBooking * 10) / 10,
      booking_date: booking.scheduled_date,
      service_price: booking.service_price,
      current_status: booking.status,
      payment_paid: booking.payment_paid
    })
  } catch (error: any) {
    console.error("Error checking refund eligibility:", error)
    res.status(500).json({ error: error.message || "Failed to check refund eligibility" })
  }
}
