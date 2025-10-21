import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BOOKING_MODULE } from "../../modules/booking"

export type UpdateBookingStatusStepInput = {
  booking_id: string
  checked_in: boolean
  checked_in_at: string
}

export const updateBookingStatusStep = createStep(
  "update-booking-status",
  async (input: UpdateBookingStatusStepInput, { container }) => {
    const bookingModuleService = container.resolve(BOOKING_MODULE)
    
    const currentBooking = await bookingModuleService.retrieveBooking(input.booking_id)
    
    const updatedBooking = await bookingModuleService.updateBookings({
      id: input.booking_id,
      checked_in: input.checked_in,
      checked_in_at: new Date(input.checked_in_at)
    })

    return new StepResponse(updatedBooking, {
      id: input.booking_id,
      previousCheckedIn: currentBooking.checked_in,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    
    const bookingModuleService = container.resolve(BOOKING_MODULE)
    await bookingModuleService.updateBookings({
      id: compensationData.id,
      checked_in: compensationData.previousCheckedIn,
      checked_in_at: null
    })
  }
)
