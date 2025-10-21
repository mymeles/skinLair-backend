import { model } from "@medusajs/framework/utils"

export const Venue = model.define("venue", {
  id: model.id().primaryKey(),
  name: model.text(),
  address: model.text().nullable(),
  phone: model.text().nullable(),
  email: model.text().nullable(),
  is_active: model.boolean().default(true),
  // Service provider information
  provider_name: model.text().nullable(),
  provider_phone: model.text().nullable(),
  provider_email: model.text().nullable(),
})

export default Venue