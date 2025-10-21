import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const service = await bookingModuleService.retrieveService(id)
    
    res.json({
      service
    })
  } catch (error) {
    console.error("Error fetching service:", error)
    res.status(500).json({
      error: "Failed to fetch service"
    })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const serviceData = req.body as any
    
    const service = await bookingModuleService.updateServices({
      id,
      ...serviceData
    })
    
    res.json({
      service
    })
  } catch (error) {
    console.error("Error updating service:", error)
    res.status(500).json({
      error: "Failed to update service"
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    await bookingModuleService.deleteServices(id)
    
    res.status(204).send()
  } catch (error) {
    console.error("Error deleting service:", error)
    res.status(500).json({
      error: "Failed to delete service"
    })
  }
}