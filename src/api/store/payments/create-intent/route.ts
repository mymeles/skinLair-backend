import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { randomUUID } from "crypto"
import { createPaymentIntent } from "@modules/payment/stripe-service"
import { BOOKING_MODULE } from "@modules/booking"

/**
 * Create a payment intent for a booking
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("[Payment] POST /store/payments/create-intent")
  console.log("[Payment] Headers:", {
    publishableKey: req.headers["x-publishable-api-key"] ? "Present" : "Missing",
    contentType: req.headers["content-type"],
  })

  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const { booking_id, payment_type } = req.body as { booking_id?: string; payment_type?: string }

  console.log("[Payment] Request body:", { booking_id, payment_type })

  if (!booking_id || !payment_type) {
    console.error("[Payment] Missing required fields")
    return res.status(400).json({
      error: "Missing required fields: booking_id, payment_type"
    })
  }

  try {
    // Get booking details
    const booking = await bookingModuleService.retrieveBooking(booking_id)
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    // Determine amount based on payment type
    let amount = 0
    let description = ""

    if (payment_type === "deposit") {
      if (!booking.deposit_amount) {
        return res.status(400).json({ error: "No deposit required for this booking" })
      }
      amount = booking.deposit_amount
      description = `Deposit for ${booking.service_name} - ${booking.customer_name}`
    } else if (payment_type === "full") {
      amount = booking.service_price
      description = `Full payment for ${booking.service_name} - ${booking.customer_name}`
    } else {
      return res.status(400).json({ error: "Invalid payment_type. Must be 'deposit' or 'full'" })
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount,
      customer_email: booking.customer_email,
      description,
      metadata: {
        booking_id: booking.id,
        payment_type,
        service_name: booking.service_name,
        customer_name: booking.customer_name,
      },
    })

    // Create payment record
    const payment = await bookingModuleService.createPayments({
      id: `pay_${randomUUID()}`,
      booking_id: booking.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency: "usd",
      status: "pending",
      payment_type,
      customer_email: booking.customer_email,
      metadata: {
        service_name: booking.service_name,
      },
    })

    res.json({
      payment,
      client_secret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error("Payment intent creation error:", error)
    res.status(500).json({ error: error.message || "Failed to create payment intent" })
  }
}
