import { model } from "@medusajs/framework/utils"

const Booking = model.define("booking", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  customer_name: model.text(),
  customer_email: model.text(),
  customer_phone: model.text().nullable(),
  service_id: model.text(),
  service_name: model.text(),
  service_duration: model.number(), // in minutes
  service_price: model.number(),
  scheduled_date: model.dateTime(),
  scheduled_time: model.text(),
  end_time: model.text(),
  status: model.enum([
    "pending",
    "confirmed",
    "cancelled",
    "completed",
    "no_show"
  ]).default("pending"),
  notes: model.text().nullable(),
  staff_id: model.text().nullable(),
  staff_name: model.text().nullable(),
  payment_paid: model.boolean().default(false),
  reminder_sent: model.boolean().default(false),
  // Integration with Medusa's order system
  order_id: model.text().nullable(), // Link to Medusa order
  cart_id: model.text().nullable(), // Link to Medusa cart
  // QR code for check-in (following tutorial pattern)
  qr_code: model.text().nullable(),
  checked_in: model.boolean().default(false),
  checked_in_at: model.dateTime().nullable(),
  // Refund fields
  refund_amount: model.number().nullable(),
  refund_reason: model.text().nullable(),
})

export default Booking
