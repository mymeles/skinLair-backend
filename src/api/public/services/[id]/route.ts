import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const serviceData = req.body as any
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({ error: "Service ID is required" })
    }
    
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
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({ error: "Service ID is required" })
    }
    
    await bookingModuleService.deleteServices(id)
    
    res.json({
      success: true
    })
  } catch (error) {
    console.error("Error deleting service:", error)
    res.status(500).json({
      error: "Failed to delete service"
    })
  }
}
