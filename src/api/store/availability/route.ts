import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// Inline utility functions to avoid import issues
async function getAvailableTimeSlots(
  bookingModuleService: BookingModuleService,
  profile: any,
  requestedDate: Date,
  serviceDuration: number
): Promise<{ time: string; endTime: string; available: boolean }[]> {
  const slots: { time: string; endTime: string; available: boolean }[] = []
  
  try {
    // Get working hours for the day
    const dayOfWeek = requestedDate.getDay()
    const dayName = getDayName(dayOfWeek)
    const workingHour = profile.workingHours.find((wh: any) => wh.day === dayName)
    
    if (!workingHour || !workingHour.isWorking) {
      return slots // No working hours for this day
    }

    // Check for blocked dates
    const dateStr = requestedDate.toISOString().split('T')[0]
    const blockedDate = profile.blockedDates.find((bd: any) => bd.date === dateStr)
    
    if (blockedDate && blockedDate.isAllDay) {
      return slots // Day is completely blocked
    }

    // Get existing bookings for this date
    const existingBookings = await bookingModuleService.listBookings({
      scheduled_date: requestedDate,
      status: { $in: ["pending", "confirmed"] }
    })

    // Generate time slots in 30-minute intervals
    const slotDuration = 30
    const [startHour, startMin] = workingHour.startTime.split(':').map(Number)
    const [endHour, endMin] = workingHour.endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    for (let time = startMinutes; time < endMinutes; time += slotDuration) {
      const slotTime = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`
      const slotEndMinutes = time + serviceDuration
      const slotEndTime = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`

      // Check if slot would extend beyond working hours
      if (slotEndMinutes > endMinutes) {
        continue
      }

      // Check if time falls within blocked time range
      let isBlocked = false
      if (blockedDate && blockedDate.startTime && blockedDate.endTime) {
        if (slotTime >= blockedDate.startTime && slotTime < blockedDate.endTime) {
          isBlocked = true
        }
      }

      if (isBlocked) {
        continue
      }

      // Check for conflicts with existing bookings
      const hasConflict = existingBookings.some((booking: any) => {
        const bookingStart = booking.scheduled_time
        const bookingEnd = booking.end_time
        return (
          (slotTime >= bookingStart && slotTime < bookingEnd) ||
          (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
          (slotTime <= bookingStart && slotEndTime >= bookingEnd)
        )
      })

      slots.push({
        time: slotTime,
        endTime: slotEndTime,
        available: !hasConflict
      })
    }

    return slots
  } catch (error) {
    console.error("Error getting available time slots:", error)
    return slots
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek]
}

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

  const requestedDate = new Date(date as string)

  // Get esthetician profile (this would come from a database in production)
  const estheticianProfile = {
    name: "Dr. Sarah Johnson",
    specialty: "Advanced Skincare & Anti-Aging",
    experience: "8+ years",
    rating: 4.9,
    totalSessions: 1247,
    totalInPersonSessions: 892,
    availability: ["9:00 AM - 5:00 PM", "Monday - Friday"],
    bio: "Certified esthetician specializing in advanced skincare treatments, virtual consultations, and in-person spa services.",
    services: [
      "Virtual Skin Analysis",
      "Treatment Planning", 
      "Classic Facial",
      "Microneedling",
      "Chemical Peel",
      "HydraFacial",
      "Laser Hair Removal",
      "Anti-Aging Treatments"
    ],
    workingHours: [
      { day: "Monday", startTime: "09:00", endTime: "17:00", isWorking: true },
      { day: "Tuesday", startTime: "09:00", endTime: "17:00", isWorking: true },
      { day: "Wednesday", startTime: "09:00", endTime: "17:00", isWorking: true },
      { day: "Thursday", startTime: "09:00", endTime: "17:00", isWorking: true },
      { day: "Friday", startTime: "09:00", endTime: "17:00", isWorking: true },
      { day: "Saturday", startTime: "10:00", endTime: "15:00", isWorking: true },
      { day: "Sunday", startTime: "10:00", endTime: "15:00", isWorking: false }
    ],
    blockedDates: [
      {
        id: "1",
        date: "2024-12-25",
        reason: "Christmas Day",
        isAllDay: true
      },
      {
        id: "2", 
        date: "2024-12-31",
        reason: "New Year's Eve",
        isAllDay: true
      }
    ]
  }

  try {
    // Get available time slots based on esthetician's schedule
    const slots = await getAvailableTimeSlots(
      bookingModuleService,
      estheticianProfile,
      requestedDate,
      service.duration
    )

    // Format slots for API response
    const formattedSlots = slots
      .filter(slot => slot.available)
      .map(slot => ({
        time: slot.time,
        end_time: slot.endTime,
        available: true,
        staff_id: "esthetician-1",
        staff_name: estheticianProfile.name,
      }))

    res.json({ slots: formattedSlots })
  } catch (error) {
    console.error("Error getting availability slots:", error)
    res.status(500).json({ error: "Failed to get availability slots" })
  }
}
