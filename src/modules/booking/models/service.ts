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
  deposit_required: model.boolean().default(false),
  deposit_amount: model.number().nullable(),
  buffer_time: model.number().default(0), // buffer between appointments
  max_advance_booking: model.number().default(90), // days in advance
})

export default Service
