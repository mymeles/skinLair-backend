import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPaymentIntent } from "@modules/payment/stripe-service"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"
import { sendPaymentConfirmation } from "@modules/notification/email-service"

/**
 * Confirm payment after Stripe confirms the payment intent
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("[Payment] POST /store/payments/confirm")
  console.log("[Payment] Headers:", {
    publishableKey: req.headers["x-publishable-api-key"] ? "Present" : "Missing",
    contentType: req.headers["content-type"],
  })

  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const { payment_intent_id } = req.body as { payment_intent_id?: string }

  console.log("[Payment] Request body:", { payment_intent_id })

  if (!payment_intent_id) {
    console.error("[Payment] Missing payment_intent_id")
    return res.status(400).json({
      error: "Missing required field: payment_intent_id"
    })
  }

  try {
    // Get payment intent from Stripe
    const paymentIntent = await getPaymentIntent(payment_intent_id)

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: "Payment not completed",
        status: paymentIntent.status
      })
    }

    // Find payment record using Stripe Payment Intent ID as primary key
    const payment = await bookingModuleService.retrievePayment(payment_intent_id)

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" })
    }
    
    console.log("Payment confirmation - attempting to update payment with ID:", payment.id)
    console.log("Payment ID type:", typeof payment.id)
    console.log("Payment ID length:", payment.id?.length)
    console.log("Payment ID stringified:", JSON.stringify(payment.id))
    console.log("Payment object keys:", Object.keys(payment))

    // Update payment status using the correct Medusa service method
    try {
      console.log("Trying updatePayments with payment.id:", payment.id)
      await bookingModuleService.updatePayments({
        id: payment.id,
        status: "succeeded",
        stripe_charge_id: paymentIntent.latest_charge as string,
      })
    } catch (updateError: any) {
      console.error("updatePayments failed with error:", updateError.message)
      console.error("Error details:", updateError)
      throw updateError
    }

    // Update booking
    const booking = await bookingModuleService.retrieveBooking(payment.booking_id)

    // Update booking to mark payment as paid and confirm booking
    await bookingModuleService.updateBookings({
      id: payment.booking_id,
      payment_paid: true,
      status: "confirmed",
    })

    // Send confirmation email
    const updatedBooking = await bookingModuleService.retrieveBooking(payment.booking_id)
    await sendPaymentConfirmation(payment, updatedBooking)

    res.json({
      success: true,
      payment,
      booking: updatedBooking,
    })
  } catch (error: any) {
    console.error("Payment confirmation error:", error)
    res.status(500).json({ error: error.message || "Failed to confirm payment" })
  }
}
