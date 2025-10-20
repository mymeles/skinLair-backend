import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"
import stripe from "@modules/payment/stripe-client"
import { BOOKING_MODULE } from "@modules/booking"

/**
 * Stripe webhook handler for /webhooks/stripe
 * Handles payment events and updates booking status
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const sig = req.headers["stripe-signature"] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured")
    return res.status(400).json({ error: "Webhook secret not configured" })
  }

  let event: Stripe.Event

  try {
    // Use raw body for signature verification
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      webhookSecret
    )
    console.log("Stripe event received:", event.type)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("Payment intent succeeded:", paymentIntent.id)

        // Find and update payment record using Stripe Payment Intent ID as primary key
        console.log("Looking for payment with intent ID:", paymentIntent.id)
        const payment = await bookingModuleService.retrievePayment(paymentIntent.id)
        
        if (payment) {
          console.log("Payment found with ID:", payment.id)
          console.log("Payment object:", JSON.stringify(payment, null, 2))

          console.log("Attempting to update payment with ID:", payment.id)
          console.log("Payment ID type:", typeof payment.id)
          console.log("Payment ID length:", payment.id?.length)
          
          await bookingModuleService.updatePayments({
            id: payment.id,
            status: "succeeded",
            stripe_charge_id: paymentIntent.latest_charge as string,
            updated_at: new Date(),
          } as any)

          // Update booking status
          if (payment.payment_type === "deposit") {
            await bookingModuleService.updateBookings({
              id: payment.booking_id,
              deposit_paid: true,
              status: "confirmed",
              updated_at: new Date(),
            } as any)
          }

          console.log("Payment and booking updated successfully")
        } else {
          console.log("No payment record found for payment intent:", paymentIntent.id)
        }
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log("Payment intent failed:", failedPayment.id)

        const failedPaymentRecord = await bookingModuleService.retrievePayment(failedPayment.id)

        if (failedPaymentRecord) {
          await bookingModuleService.updatePayments({
            id: failedPaymentRecord.id,
            status: "failed",
            updated_at: new Date(),
          } as any)
          console.log("Payment marked as failed")
        }
        break

      case "charge.refunded":
        const refund = event.data.object as Stripe.Charge
        console.log("Charge refunded:", refund.id)

        const refundedPayments = await bookingModuleService.listPayments({
          stripe_charge_id: refund.id,
        })

        if (refundedPayments && refundedPayments.length > 0) {
          await bookingModuleService.updatePayments({
            id: refundedPayments[0].id,
            status: "refunded",
            refund_amount: refund.amount_refunded,
            updated_at: new Date(),
          } as any)
          console.log("Payment marked as refunded")
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error: any) {
    console.error("Webhook handler error:", error)
    res.status(500).json({ error: error.message })
  }
}
