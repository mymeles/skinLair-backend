import { model } from "@medusajs/framework/utils"
import { TicketProduct } from "./ticket-product"
import { TicketProductVariant } from "./ticket-product-variant"

export const TicketPurchase = model.define("ticket_purchase", {
  id: model.id().primaryKey(),
  ticket_product: model.belongsTo(() => TicketProduct, {
    mappedBy: "purchases",
  }),
  ticket_product_variant: model.belongsTo(() => TicketProductVariant, {
    mappedBy: "purchases",
  }),
  order_id: model.text().nullable(), // Link to Medusa order
  customer_id: model.text().nullable(),
  customer_name: model.text(),
  customer_email: model.text(),
  customer_phone: model.text().nullable(),
  // Service booking details
  service_name: model.text(),
  service_duration: model.number(), // in minutes
  scheduled_date: model.dateTime(),
  scheduled_time: model.text(),
  end_time: model.text(),
  status: model.enum([
    "pending",
    "confirmed", 
    "cancelled",
    "completed",
    "no_show",
    "scanned" // For check-in verification
  ]).default("pending"),
  // QR code and verification
  qr_code: model.text().nullable(),
  checked_in: model.boolean().default(false),
  checked_in_at: model.dateTime().nullable(),
  // Additional booking info
  notes: model.text().nullable(),
  staff_id: model.text().nullable(),
  staff_name: model.text().nullable(),
  payment_paid: model.boolean().default(false),
}).indexes([
  {
    on: ["order_id"],
  },
  {
    on: ["customer_email"],
  },
  {
    on: ["scheduled_date", "status"],
  },
])

export default TicketPurchase