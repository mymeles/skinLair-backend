import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createPaymentIntent } from "@modules/payment/stripe-service"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

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

  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const { booking_id } = req.body as { booking_id?: string }

  console.log("[Payment] Request body:", { booking_id })

  if (!booking_id) {
    console.error("[Payment] Missing required fields")
    return res.status(400).json({
      error: "Missing required field: booking_id"
    })
  }

  try {
    // Get booking details
    const booking = await bookingModuleService.retrieveBooking(booking_id)
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    // Always require full payment
    const amount = booking.service_price
    const description = `Full payment for ${booking.service_name} - ${booking.customer_name}`

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount,
      customer_email: booking.customer_email,
      description,
      metadata: {
        booking_id: booking.id,
        payment_type: "full",
        service_name: booking.service_name,
        customer_name: booking.customer_name,
      },
    })

    // Create payment record using Stripe Payment Intent ID as primary key
    console.log("[Payment] Creating payment record with ID:", paymentIntent.id)
    console.log("[Payment] Payment data:", {
      id: paymentIntent.id,
      booking_id: booking.id,
      amount,
      currency: "usd",
      status: "pending",
        payment_type: "full",
      customer_email: booking.customer_email,
      metadata: {
        service_name: booking.service_name,
      },
    })
    
    let payment
    try {
      payment = await bookingModuleService.createPayments({
        id: paymentIntent.id, // Use Stripe Payment Intent ID as primary key
        booking_id: booking.id,
        amount,
        currency: "usd",
        status: "pending",
        payment_type: "full",
        customer_email: booking.customer_email,
        metadata: {
          service_name: booking.service_name,
        },
      })
      console.log("[Payment] Payment record created successfully:", payment.id)
      console.log("[Payment] Full payment object:", JSON.stringify(payment, null, 2))
    } catch (createError) {
      console.error("[Payment] Error creating payment record:", createError)
      throw createError
    }

    res.json({
      payment,
      client_secret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error("Payment intent creation error:", error)
    res.status(500).json({ error: error.message || "Failed to create payment intent" })
  }
}
