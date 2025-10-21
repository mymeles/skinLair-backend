import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// GET availability slots
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const { date, service_id, staff_id } = req.query

  if (!date || !service_id) {
    return res.status(400).json({
      error: "Missing required parameters: date, service_id"
    })
  }

  // Get service details
  const service = await bookingModuleService.retrieveService(service_id as string)
  
  if (!service) {
    return res.status(404).json({ error: "Service not found" })
  }

  // Get day of week from date
  const requestedDate = new Date(date as string)
  const dayOfWeek = requestedDate.getDay()

  // Get availability for this day
  const availabilityFilters: any = { day_of_week: dayOfWeek, is_available: true }
  if (staff_id) {
    availabilityFilters.staff_id = staff_id
  }

  const availabilities = await bookingModuleService.listAvailabilities(availabilityFilters)

  if (availabilities.length === 0) {
    return res.json({ slots: [] })
  }

  // Get existing bookings for this date
  const bookings = await bookingModuleService.listBookings({
    scheduled_date: requestedDate,
    status: { $in: ["pending", "confirmed"] },
  })

  // Generate time slots
  const slots: any[] = []
  const slotDuration = 30 // 30-minute intervals

  for (const availability of availabilities) {
    const [startHour, startMin] = availability.start_time.split(':').map(Number)
    const [endHour, endMin] = availability.end_time.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    for (let time = startMinutes; time < endMinutes; time += slotDuration) {
      const slotTime = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`
      const slotEndTime = `${Math.floor((time + service.duration) / 60).toString().padStart(2, '0')}:${((time + service.duration) % 60).toString().padStart(2, '0')}`

      // Check if slot would extend beyond availability
      if (time + service.duration > endMinutes) {
        continue
      }

      // Check for conflicts with existing bookings
      const hasConflict = bookings.some((booking: any) => {
        if (staff_id && booking.staff_id && booking.staff_id !== staff_id) {
          return false
        }
        const bookingStart = booking.scheduled_time
        const bookingEnd = booking.end_time
        return (
          (slotTime >= bookingStart && slotTime < bookingEnd) ||
          (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
          (slotTime <= bookingStart && slotEndTime >= bookingEnd)
        )
      })

      if (!hasConflict) {
        slots.push({
          time: slotTime,
          end_time: slotEndTime,
          available: true,
          staff_id: availability.staff_id,
          staff_name: availability.staff_name,
        })
      }
    }
  }

  res.json({ slots })
}
