import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyBookingWorkflow } from "../../../../workflows/verify-booking"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const result = await verifyBookingWorkflow(req.scope).run({
      input: {
        booking_id: id,
      },
    })
    
    res.json({
      success: true,
      booking: result
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
