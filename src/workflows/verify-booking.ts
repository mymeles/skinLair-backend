import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { verifyBookingStep } from "./steps/verify-booking-step"
import { updateBookingStatusStep } from "./steps/update-booking-status-step"

export type VerifyBookingWorkflowInput = {
  booking_id: string
}

export const verifyBookingWorkflow = createWorkflow(
  "verify-booking",
  function (input: VerifyBookingWorkflowInput) {
    verifyBookingStep(input)
    
    const updatedBooking = updateBookingStatusStep({
      booking_id: input.booking_id,
      checked_in: true,
      checked_in_at: new Date().toISOString()
    })

    return new WorkflowResponse(updatedBooking)
  }
)