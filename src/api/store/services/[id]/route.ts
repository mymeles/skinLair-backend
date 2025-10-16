import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"

// GET single service
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const { id } = req.params

  try {
    const service = await bookingModuleService.retrieveService(id)
    res.json({ service })
  } catch (error) {
    res.status(404).json({ error: "Service not found" })
  }
}
