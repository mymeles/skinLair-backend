import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BOOKING_MODULE } from "../../modules/booking"
import { MedusaError } from "@medusajs/framework/utils"

export type VerifyBookingStepInput = {
  booking_id: string
}

export const verifyBookingStep = createStep(
  "verify-booking",
  async (input: VerifyBookingStepInput, { container }) => {
    const bookingModuleService = container.resolve(BOOKING_MODULE)
    
    const booking = await bookingModuleService.retrieveBooking(input.booking_id)

    if (!booking) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Booking not found"
      )
    }

    if (booking.status !== "confirmed") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Booking is not confirmed"
      )
    }

    if (booking.checked_in) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Booking has already been checked in"
      )
    }

    // Check if booking is for today
    const today = new Date()
    const bookingDate = new Date(booking.scheduled_date)
    
    if (bookingDate.toDateString() !== today.toDateString()) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Booking is not for today"
      )
    }

    return new StepResponse(booking)
  }
)
