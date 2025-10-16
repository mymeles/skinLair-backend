import { MedusaService } from "@medusajs/framework/utils"
import Booking from "./models/booking"
import Service from "./models/service"
import Availability from "./models/availability"
import Payment from "./models/payment"

class BookingModuleService extends MedusaService({
  Booking,
  Service,
  Availability,
  Payment,
}) {}

export default BookingModuleService
