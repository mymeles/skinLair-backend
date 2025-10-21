import { MedusaService } from "@medusajs/framework/utils"
import Booking from "./models/booking"
import Service from "./models/service"
import Availability from "./models/availability"
import Payment from "./models/payment"
import SessionTime from "./models/session-time"
import Venue from "./models/venue"
import TicketProduct from "./models/ticket-product"
import TicketProductVariant from "./models/ticket-product-variant"
import TicketPurchase from "./models/ticket-purchase"

class BookingModuleService extends MedusaService({
  Booking,
  Service,
  Availability,
  Payment,
  SessionTime,
  Venue,
  TicketProduct,
  TicketProductVariant,
  TicketPurchase,
}) {
  // Add debug method to test payment creation
  async testPaymentCreation() {
    console.log("Testing payment creation...")
    try {
      const testPayment = await this.createPayments({
        id: "test_payment_debug",
        booking_id: "01K7QHMJ1MMBQA0TRA7S85AN5W",
        amount: 100,
        currency: "usd",
        status: "pending",
        payment_type: "full",
        customer_email: "test@example.com",
      })
      console.log("Test payment created:", testPayment)
      return testPayment
    } catch (error) {
      console.error("Test payment creation failed:", error)
      throw error
    }
  }
}

export default BookingModuleService
