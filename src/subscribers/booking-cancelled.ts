import type { 
  SubscriberConfig, 
  SubscriberArgs,
} from "@medusajs/framework"
import { sendBookingCancellation } from "../modules/notification/email-service"

export default async function bookingCancelledHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  try {
    const bookingId = data.id
    
    console.log(`Booking cancelled notification for: ${bookingId}`)
    
    // Send cancellation email
    // await sendBookingCancellation(booking)
    
  } catch (error) {
    console.error("Error sending cancellation email:", error)
  }
}

export const config: SubscriberConfig = {
  event: "booking.cancelled",
}
