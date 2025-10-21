import { model } from "@medusajs/framework/utils"
import { Venue } from "./venue"
import { TicketProductVariant } from "./ticket-product-variant"
import { TicketPurchase } from "./ticket-purchase"

export const TicketProduct = model.define("ticket_product", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(), // Link to Medusa product
  service_id: model.text(), // Link to our service
  venue: model.belongsTo(() => Venue),
  dates: model.array(), // Available dates for booking
  time_slots: model.array(), // Available time slots
  is_active: model.boolean().default(true),
  variants: model.hasMany(() => TicketProductVariant, {
    mappedBy: "ticket_product",
  }),
  purchases: model.hasMany(() => TicketPurchase, {
    mappedBy: "ticket_product",
  }),
}).indexes([
  {
    on: ["venue_id", "dates"],
  },
])

export default TicketProduct