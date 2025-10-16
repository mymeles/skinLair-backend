import { model } from "@medusajs/framework/utils"

const Availability = model.define("availability", {
  id: model.id().primaryKey(),
  staff_id: model.text().nullable(),
  staff_name: model.text().nullable(),
  day_of_week: model.number(), // 0-6 (Sunday-Saturday)
  start_time: model.text(),
  end_time: model.text(),
  is_available: model.boolean().default(true),
})

export default Availability
