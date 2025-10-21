import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// GET available session times for a service
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const { service_id, date } = req.query

  if (!service_id) {
    return res.status(400).json({
      error: "Missing required parameter: service_id"
    })
  }

  try {
    // Get service details
    const service = await bookingModuleService.retrieveService(service_id as string)
    if (!service) {
      return res.status(404).json({ error: "Service not found" })
    }

    // Get session times for this service
    const sessionTimes = await bookingModuleService.listSessionTimes({
      service_id: service_id as string,
      is_available: true,
    })

    // If no specific date provided, return all available session times
    if (!date) {
      return res.json({ session_times: sessionTimes })
    }

    // Filter by specific date
    const targetDate = new Date(date as string)
    const dayOfWeek = targetDate.getDay()

    const availableTimes = sessionTimes.filter((session: any) => 
      session.day_of_week === dayOfWeek
    )

    // Check for existing bookings on this date
    const existingBookings = await bookingModuleService.listBookings({
      service_id: service_id as string,
      scheduled_date: targetDate,
      status: { $in: ["pending", "confirmed"] },
    })

    // Filter out times that are already booked
    const availableSlots = availableTimes.filter((session: any) => {
      const sessionStart = session.start_time
      const sessionEnd = session.end_time
      
      // Check if any existing booking conflicts with this session
      const hasConflict = existingBookings.some((booking: any) => {
        const bookingStart = booking.scheduled_time
        const bookingEnd = booking.end_time
        
        return (
          (sessionStart >= bookingStart && sessionStart < bookingEnd) ||
          (sessionEnd > bookingStart && sessionEnd <= bookingEnd) ||
          (sessionStart <= bookingStart && sessionEnd >= bookingEnd)
        )
      })

      return !hasConflict
    })

    res.json({ 
      session_times: availableSlots,
      service_duration: service.duration 
    })
  } catch (error: any) {
    console.error("Error fetching session times:", error)
    res.status(500).json({ error: error.message || "Failed to fetch session times" })
  }
}

// POST create new session time
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const {
    service_id,
    day_of_week,
    start_time,
    end_time,
    max_bookings = 1,
    buffer_before = 0,
    buffer_after = 0,
  } = req.body as {
    service_id?: string
    day_of_week?: number
    start_time?: string
    end_time?: string
    max_bookings?: number
    buffer_before?: number
    buffer_after?: number
  }

  // Validate required fields
  if (!service_id || day_of_week === undefined || !start_time || !end_time) {
    return res.status(400).json({
      error: "Missing required fields: service_id, day_of_week, start_time, end_time"
    })
  }

  try {
    // Verify service exists
    const service = await bookingModuleService.retrieveService(service_id)
    if (!service) {
      return res.status(404).json({ error: "Service not found" })
    }

    // Create session time
    const sessionTime = await bookingModuleService.createSessionTimes({
      service_id,
      day_of_week,
      start_time,
      end_time,
      max_bookings,
      buffer_before,
      buffer_after,
      is_available: true,
    })

    res.status(201).json({ session_time: sessionTime })
  } catch (error: any) {
    console.error("Error creating session time:", error)
    res.status(500).json({ error: error.message || "Failed to create session time" })
  }
}
