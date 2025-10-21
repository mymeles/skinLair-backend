import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// GET all session times
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  try {
    const sessionTimes = await bookingModuleService.listSessionTimes({})
    
    // Get service names for each session time
    const sessionTimesWithServiceNames = await Promise.all(
      sessionTimes.map(async (sessionTime: any) => {
        try {
          const service = await bookingModuleService.retrieveService(sessionTime.service_id)
          return {
            ...sessionTime,
            service_name: service?.name || 'Unknown Service'
          }
        } catch (error) {
          return {
            ...sessionTime,
            service_name: 'Unknown Service'
          }
        }
      })
    )

    res.json({ session_times: sessionTimesWithServiceNames })
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
    is_available = true,
    max_bookings = 1,
    buffer_before = 0,
    buffer_after = 0,
  } = req.body as {
    service_id?: string
    day_of_week?: number
    start_time?: string
    end_time?: string
    is_available?: boolean
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

  // Validate day of week
  if (day_of_week < 0 || day_of_week > 6) {
    return res.status(400).json({
      error: "day_of_week must be between 0 (Sunday) and 6 (Saturday)"
    })
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    return res.status(400).json({
      error: "Invalid time format. Use HH:MM format (24-hour)"
    })
  }

  // Validate that end time is after start time
  const startMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1])
  const endMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1])
  
  if (endMinutes <= startMinutes) {
    return res.status(400).json({
      error: "End time must be after start time"
    })
  }

  try {
    // Verify service exists
    const service = await bookingModuleService.retrieveService(service_id)
    if (!service) {
      return res.status(404).json({ error: "Service not found" })
    }

    // Check for overlapping session times
    const existingSessionTimes = await bookingModuleService.listSessionTimes({
      service_id,
      day_of_week,
      is_available: true,
    })

    const hasOverlap = existingSessionTimes.some((existing: any) => {
      const existingStart = parseInt(existing.start_time.split(':')[0]) * 60 + parseInt(existing.start_time.split(':')[1])
      const existingEnd = parseInt(existing.end_time.split(':')[0]) * 60 + parseInt(existing.end_time.split(':')[1])
      
      return (
        (startMinutes >= existingStart && startMinutes < existingEnd) ||
        (endMinutes > existingStart && endMinutes <= existingEnd) ||
        (startMinutes <= existingStart && endMinutes >= existingEnd)
      )
    })

    if (hasOverlap) {
      return res.status(409).json({
        error: "Time slot overlaps with existing session time for this service and day"
      })
    }

    // Create session time
    const sessionTime = await bookingModuleService.createSessionTimes({
      service_id,
      day_of_week,
      start_time,
      end_time,
      is_available,
      max_bookings,
      buffer_before,
      buffer_after,
    })

    res.status(201).json({ session_time: sessionTime })
  } catch (error: any) {
    console.error("Error creating session time:", error)
    res.status(500).json({ error: error.message || "Failed to create session time" })
  }
}
