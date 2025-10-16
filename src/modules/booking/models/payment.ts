import { model } from "@medusajs/framework/utils"

const Payment = model.define("booking_payment", {
  id: model.text().primaryKey(), // Use Stripe Payment Intent ID as primary key
  booking_id: model.text(),
  stripe_charge_id: model.text().nullable(),
  amount: model.number(),
  currency: model.text().default("usd"),
  status: model.enum([
    "pending",
    "processing",
    "succeeded",
    "failed",
    "cancelled",
    "refunded"
  ]).default("pending"),
  payment_type: model.enum(["full", "deposit"]).default("deposit"),
  customer_email: model.text(),
  metadata: model.json().nullable(),
  refund_amount: model.number().nullable(),
  refund_reason: model.text().nullable(),
})

export default Payment
