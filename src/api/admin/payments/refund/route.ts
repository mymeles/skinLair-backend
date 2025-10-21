import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createRefund } from "@modules/payment/stripe-service"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

/**
 * Issue a refund for a payment
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const { payment_id, amount, reason } = req.body as {
    payment_id?: string
    amount?: number
    reason?: string
  }

  if (!payment_id) {
    return res.status(400).json({
      error: "Missing required field: payment_id"
    })
  }

  try {
    // Get payment record
    const payment = await bookingModuleService.retrievePayment(payment_id)
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" })
    }

    if (payment.status !== "succeeded") {
      return res.status(400).json({ error: "Can only refund succeeded payments" })
    }

    // Create refund in Stripe using payment ID (which is now the Stripe Payment Intent ID)
    const refund = await createRefund({
      payment_intent_id: payment.id,
      amount,
      reason,
    })

    // Update payment record
    await bookingModuleService.updatePayments({
      id: payment_id,
      status: "refunded",
      refund_amount: refund.amount,
      refund_reason: reason,
    })

    // Update booking if it was a deposit
    // Update booking to mark payment as unpaid
    await bookingModuleService.updateBookings({
      id: payment.booking_id,
      payment_paid: false,
    })

    res.json({
      success: true,
      refund,
    })
  } catch (error: any) {
    console.error("Refund error:", error)
    res.status(500).json({ error: error.message || "Failed to process refund" })
  }
}
