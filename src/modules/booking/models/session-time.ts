import { model } from "@medusajs/framework/utils"

const SessionTime = model.define("session_time", {
  id: model.id().primaryKey(),
  service_id: model.text(),
  day_of_week: model.number(), // 0 = Sunday, 1 = Monday, etc.
  start_time: model.text(), // "09:00"
  end_time: model.text(), // "17:00"
  is_available: model.boolean().default(true),
  max_bookings: model.number().default(1), // max bookings per time slot
  buffer_before: model.number().default(0), // minutes before this slot
  buffer_after: model.number().default(0), // minutes after this slot
})

export default SessionTime
