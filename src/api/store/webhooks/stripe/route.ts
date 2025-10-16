import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"
import stripe from "@modules/payment/stripe-client"
import { BOOKING_MODULE } from "@modules/booking"

/**
 * Stripe webhook handler
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured")
    return res.status(400).json({ error: "Webhook secret not configured" })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body as string | Buffer,
      sig,
      webhookSecret
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find and update payment record
        const payments = await bookingModuleService.listPayments({
          stripe_payment_intent_id: paymentIntent.id,
        })

        if (payments && payments.length > 0) {
          const payment = payments[0]

          await bookingModuleService.updatePayments(payment.id as any, {
            status: "succeeded",
            stripe_charge_id: paymentIntent.latest_charge as string,
            updated_at: new Date(),
          } as any)

          // Update booking status
          if (payment.payment_type === "deposit") {
            await bookingModuleService.updateBookings(payment.booking_id as any, {
              deposit_paid: true,
              status: "confirmed",
              updated_at: new Date(),
            } as any)
          }
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        
        const failedPayments = await bookingModuleService.listPayments({
          stripe_payment_intent_id: failedPayment.id,
        })

        if (failedPayments && failedPayments.length > 0) {
          await bookingModuleService.updatePayments(failedPayments[0].id as any, {
            status: "failed",
            updated_at: new Date(),
          } as any)
        }
        break

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge
        
        const refundedPayments = await bookingModuleService.listPayments({
          stripe_charge_id: refund.id,
        })

        if (refundedPayments && refundedPayments.length > 0) {
          await bookingModuleService.updatePayments(refundedPayments[0].id as any, {
            status: "refunded",
            refund_amount: refund.amount_refunded,
            updated_at: new Date(),
          } as any)
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
