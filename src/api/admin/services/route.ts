import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const services = await bookingModuleService.listServices()
    
    res.json({
      services: services || []
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    res.status(500).json({
      error: "Failed to fetch services"
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const serviceData = req.body as any
    
    const service = await bookingModuleService.createServices(serviceData)
    
    res.status(201).json({
      service
    })
  } catch (error) {
    console.error("Error creating service:", error)
    res.status(500).json({
      error: "Failed to create service"
    })
  }
}