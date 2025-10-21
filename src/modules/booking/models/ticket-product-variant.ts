import { model } from "@medusajs/framework/utils"
import { TicketProduct } from "./ticket-product"
import { TicketPurchase } from "./ticket-purchase"

export const TicketProductVariant = model.define("ticket_product_variant", {
  id: model.id().primaryKey(),
  variant_id: model.text().unique(), // Link to Medusa product variant
  ticket_product: model.belongsTo(() => TicketProduct, {
    mappedBy: "variants",
  }),
  date: model.dateTime(), // Specific date for this variant
  time_slot: model.text(), // Specific time slot (e.g., "09:00-10:00")
  price: model.number(), // Price for this specific time slot
  max_quantity: model.number().default(1), // Max bookings for this slot
  available_quantity: model.number().default(1), // Available bookings
  purchases: model.hasMany(() => TicketPurchase, {
    mappedBy: "ticket_product_variant",
  }),
}).indexes([
  {
    on: ["ticket_product_id", "date", "time_slot"],
    unique: true,
  },
])

export default TicketProductVariant