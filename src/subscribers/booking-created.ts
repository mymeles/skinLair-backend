import type { 
  SubscriberConfig, 
  SubscriberArgs,
} from "@medusajs/framework"
import { sendBookingConfirmation } from "../modules/notification/email-service"

export default async function bookingCreatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  try {
    // Get full booking details
    const bookingId = data.id
    
    // Note: In production, you'd fetch the full booking with:
    // const bookingModuleService = container.resolve("booking")
    // const booking = await bookingModuleService.retrieveBooking(bookingId)
    
    console.log(`Booking created notification for: ${bookingId}`)
    
    // Send confirmation email
    // await sendBookingConfirmation(booking)
    
  } catch (error) {
    console.error("Error sending booking confirmation:", error)
  }
}

export const config: SubscriberConfig = {
  event: "booking.created",
}
