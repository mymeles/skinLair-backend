import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPaymentIntent } from "@modules/payment/stripe-service"
import { BOOKING_MODULE } from "@modules/booking"
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

  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

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

    // Find payment record
    const payments = await bookingModuleService.listPayments({
      stripe_payment_intent_id: payment_intent_id,
    })

    if (!payments || payments.length === 0) {
      return res.status(404).json({ error: "Payment record not found" })
    }

    const payment = payments[0]

    // Update payment status
    await bookingModuleService.updatePayments(payment.id as any, {
      status: "succeeded",
      stripe_charge_id: paymentIntent.latest_charge as string,
      updated_at: new Date(),
    } as any)

    // Update booking
    const booking = await bookingModuleService.retrieveBooking(payment.booking_id)

    if (payment.payment_type === "deposit") {
      await bookingModuleService.updateBookings(payment.booking_id as any, {
        deposit_paid: true,
        status: "confirmed",
        updated_at: new Date(),
      } as any)
    } else if (payment.payment_type === "full") {
      await bookingModuleService.updateBookings(payment.booking_id as any, {
        deposit_paid: true,
        status: "confirmed",
        updated_at: new Date(),
      } as any)
    }

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
