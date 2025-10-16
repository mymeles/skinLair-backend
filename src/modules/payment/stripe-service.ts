import Stripe from "stripe"
import stripe from "./stripe-client"

export interface CreatePaymentIntentParams {
  amount: number
  currency?: string
  customer_email: string
  description: string
  metadata?: Record<string, string>
}

export interface RefundParams {
  payment_intent_id: string
  amount?: number
  reason?: string
}

/**
 * Create a payment intent for booking deposit or full payment
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency || "usd",
    receipt_email: params.customer_email,
    description: params.description,
    metadata: params.metadata || {},
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(
  payment_intent_id: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(payment_intent_id)
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  payment_intent_id: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.cancel(payment_intent_id)
}

/**
 * Create a refund
 */
export async function createRefund(
  params: RefundParams
): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: params.payment_intent_id,
  }

  if (params.amount) {
    refundParams.amount = params.amount
  }

  if (params.reason) {
    refundParams.reason = params.reason as Stripe.RefundCreateParams.Reason
  }

  return await stripe.refunds.create(refundParams)
}

export function constructWebhook({ signature, body }: {
  signature: any, body: any
}) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured.")
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    webhookSecret
  )
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  payment_intent_id: string,
  payment_method?: string
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentConfirmParams = {}
  
  if (payment_method) {
    params.payment_method = payment_method
  }

  return await stripe.paymentIntents.confirm(payment_intent_id, params)
}

/**
 * Create a customer in Stripe
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  })
}

/**
 * Get or create a customer
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // Search for existing customer
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  // Create new customer
  return await createCustomer(email, name)
}
