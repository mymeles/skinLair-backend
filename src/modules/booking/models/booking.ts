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
  deposit_paid: model.boolean().default(false),
  deposit_amount: model.number().nullable(),
  reminder_sent: model.boolean().default(false),
})

export default Booking
