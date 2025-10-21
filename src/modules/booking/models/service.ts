import { model } from "@medusajs/framework/utils"

const Service = model.define("service", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  duration: model.number(), // in minutes
  price: model.number(),
  category: model.text().nullable(),
  image_url: model.text().nullable(),
  is_active: model.boolean().default(true),
  buffer_time: model.number().default(0), // buffer between appointments
  max_advance_booking: model.number().default(90), // days in advance
  // Link to Medusa's product system
  product_id: model.text().nullable(), // Link to Medusa product
  variant_id: model.text().nullable(), // Link to Medusa product variant
})

export default Service
