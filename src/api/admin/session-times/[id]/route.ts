import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// PUT update session time
export const PUT = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
  const { id } = req.params

  const {
    service_id,
    day_of_week,
    start_time,
    end_time,
    is_available,
    max_bookings,
    buffer_before,
    buffer_after,
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

  try {
    // Get existing session time
    const existingSessionTime = await bookingModuleService.retrieveSessionTime(id)
    if (!existingSessionTime) {
      return res.status(404).json({ error: "Session time not found" })
    }

    // Validate day of week if provided
    if (day_of_week !== undefined && (day_of_week < 0 || day_of_week > 6)) {
      return res.status(400).json({
        error: "day_of_week must be between 0 (Sunday) and 6 (Saturday)"
      })
    }

    // Validate time format if provided
    if (start_time || end_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      const finalStartTime = start_time || existingSessionTime.start_time
      const finalEndTime = end_time || existingSessionTime.end_time
      
      if (!timeRegex.test(finalStartTime) || !timeRegex.test(finalEndTime)) {
        return res.status(400).json({
          error: "Invalid time format. Use HH:MM format (24-hour)"
        })
      }

      // Validate that end time is after start time
      const startMinutes = parseInt(finalStartTime.split(':')[0]) * 60 + parseInt(finalStartTime.split(':')[1])
      const endMinutes = parseInt(finalEndTime.split(':')[0]) * 60 + parseInt(finalEndTime.split(':')[1])
      
      if (endMinutes <= startMinutes) {
        return res.status(400).json({
          error: "End time must be after start time"
        })
      }
    }

    // Check for overlapping session times (excluding current one)
    if (start_time || end_time || day_of_week !== undefined) {
      const finalServiceId = service_id || existingSessionTime.service_id
      const finalDayOfWeek = day_of_week !== undefined ? day_of_week : existingSessionTime.day_of_week
      const finalStartTime = start_time || existingSessionTime.start_time
      const finalEndTime = end_time || existingSessionTime.end_time

      const existingSessionTimes = await bookingModuleService.listSessionTimes({
        service_id: finalServiceId,
        day_of_week: finalDayOfWeek,
        is_available: true,
      })

      const hasOverlap = existingSessionTimes.some((existing: any) => {
        if (existing.id === id) return false // Skip current session time
        
        const existingStart = parseInt(existing.start_time.split(':')[0]) * 60 + parseInt(existing.start_time.split(':')[1])
        const existingEnd = parseInt(existing.end_time.split(':')[0]) * 60 + parseInt(existing.end_time.split(':')[1])
        const newStart = parseInt(finalStartTime.split(':')[0]) * 60 + parseInt(finalStartTime.split(':')[1])
        const newEnd = parseInt(finalEndTime.split(':')[0]) * 60 + parseInt(finalEndTime.split(':')[1])
        
        return (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        )
      })

      if (hasOverlap) {
        return res.status(409).json({
          error: "Time slot overlaps with existing session time for this service and day"
        })
      }
    }

    // Update session time
    const updatedSessionTime = await bookingModuleService.updateSessionTimes({
      id,
      ...(service_id && { service_id }),
      ...(day_of_week !== undefined && { day_of_week }),
      ...(start_time && { start_time }),
      ...(end_time && { end_time }),
      ...(is_available !== undefined && { is_available }),
      ...(max_bookings !== undefined && { max_bookings }),
      ...(buffer_before !== undefined && { buffer_before }),
      ...(buffer_after !== undefined && { buffer_after }),
    })

    res.json({ session_time: updatedSessionTime })
  } catch (error: any) {
    console.error("Error updating session time:", error)
    res.status(500).json({ error: error.message || "Failed to update session time" })
  }
}

// DELETE session time
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
  const { id } = req.params

  try {
    // Check if session time exists
    const existingSessionTime = await bookingModuleService.retrieveSessionTime(id)
    if (!existingSessionTime) {
      return res.status(404).json({ error: "Session time not found" })
    }

    // Check if there are any bookings for this session time
    const bookings = await bookingModuleService.listBookings({
      service_id: existingSessionTime.service_id,
      status: { $in: ["pending", "confirmed"] },
    })

    // Check if any bookings fall within this time slot
    const hasBookings = bookings.some((booking: any) => {
      const bookingStart = booking.scheduled_time
      const bookingEnd = booking.end_time
      const sessionStart = existingSessionTime.start_time
      const sessionEnd = existingSessionTime.end_time
      
      return (
        (bookingStart >= sessionStart && bookingStart < sessionEnd) ||
        (bookingEnd > sessionStart && bookingEnd <= sessionEnd) ||
        (bookingStart <= sessionStart && bookingEnd >= sessionEnd)
      )
    })

    if (hasBookings) {
      return res.status(409).json({
        error: "Cannot delete session time with existing bookings. Please cancel or reschedule bookings first."
      })
    }

    // Delete session time
    await bookingModuleService.deleteSessionTimes(id)

    res.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting session time:", error)
    res.status(500).json({ error: error.message || "Failed to delete session time" })
  }
}
