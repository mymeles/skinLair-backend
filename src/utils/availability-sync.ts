import BookingModuleService from "@modules/booking/service"

export interface EstheticianWorkingHours {
  day: string
  startTime: string
  endTime: string
  isWorking: boolean
}

export interface EstheticianBlockedDate {
  id: string
  date: string
  startTime?: string
  endTime?: string
  reason: string
  isAllDay: boolean
}

export interface EstheticianProfile {
  name: string
  specialty: string
  experience: string
  rating: number
  totalSessions: number
  totalInPersonSessions: number
  availability: string[]
  bio: string
  services: string[]
  workingHours: EstheticianWorkingHours[]
  blockedDates: EstheticianBlockedDate[]
}

/**
 * Sync esthetician availability data to the booking system
 */
export async function syncEstheticianAvailability(
  bookingModuleService: BookingModuleService,
  profile: EstheticianProfile
): Promise<void> {
  try {
    // Clear existing availability for this esthetician
    const existingAvailabilities = await bookingModuleService.listAvailabilities({
      staff_id: "esthetician-1" // Single esthetician ID
    })
    
    for (const availability of existingAvailabilities) {
      await bookingModuleService.deleteAvailabilities(availability.id)
    }

    // Convert working hours to availability records
    for (const workingHour of profile.workingHours) {
      if (workingHour.isWorking) {
        const dayOfWeek = getDayOfWeek(workingHour.day)
        
        await bookingModuleService.createAvailabilities({
          staff_id: "esthetician-1",
          staff_name: profile.name,
          day_of_week: dayOfWeek,
          start_time: workingHour.startTime,
          end_time: workingHour.endTime,
          is_available: true
        })
      }
    }

    console.log("✅ Esthetician availability synced successfully")
  } catch (error) {
    console.error("❌ Error syncing esthetician availability:", error)
    throw error
  }
}

/**
 * Check if a specific date/time is available based on esthetician's schedule
 */
export async function checkEstheticianAvailability(
  bookingModuleService: BookingModuleService,
  profile: EstheticianProfile,
  requestedDate: Date,
  requestedTime: string
): Promise<{ available: boolean; reason?: string }> {
  try {
    // Check if date is blocked
    const dateStr = requestedDate.toISOString().split('T')[0]
    const blockedDate = profile.blockedDates.find(bd => bd.date === dateStr)
    
    if (blockedDate) {
      // Check if it's an all-day block
      if (blockedDate.isAllDay) {
        return { 
          available: false, 
          reason: `Date blocked: ${blockedDate.reason}` 
        }
      }
      
      // Check if time falls within blocked time range
      if (blockedDate.startTime && blockedDate.endTime) {
        if (requestedTime >= blockedDate.startTime && requestedTime < blockedDate.endTime) {
          return { 
            available: false, 
            reason: `Time blocked: ${blockedDate.reason}` 
          }
        }
      }
    }

    // Check working hours for the day of week
    const dayOfWeek = requestedDate.getDay()
    const dayName = getDayName(dayOfWeek)
    const workingHour = profile.workingHours.find(wh => wh.day === dayName)
    
    if (!workingHour || !workingHour.isWorking) {
      return { 
        available: false, 
        reason: `${dayName} is not a working day` 
      }
    }

    // Check if requested time is within working hours
    if (requestedTime < workingHour.startTime || requestedTime >= workingHour.endTime) {
      return { 
        available: false, 
        reason: `Outside working hours (${workingHour.startTime} - ${workingHour.endTime})` 
      }
    }

    return { available: true }
  } catch (error) {
    console.error("Error checking esthetician availability:", error)
    return { available: false, reason: "Error checking availability" }
  }
}

/**
 * Get available time slots for a specific date based on esthetician's schedule
 */
export async function getAvailableTimeSlots(
  bookingModuleService: BookingModuleService,
  profile: EstheticianProfile,
  requestedDate: Date,
  serviceDuration: number
): Promise<{ time: string; endTime: string; available: boolean }[]> {
  const slots: { time: string; endTime: string; available: boolean }[] = []
  
  try {
    // Get working hours for the day
    const dayOfWeek = requestedDate.getDay()
    const dayName = getDayName(dayOfWeek)
    const workingHour = profile.workingHours.find(wh => wh.day === dayName)
    
    if (!workingHour || !workingHour.isWorking) {
      return slots // No working hours for this day
    }

    // Check for blocked dates
    const dateStr = requestedDate.toISOString().split('T')[0]
    const blockedDate = profile.blockedDates.find(bd => bd.date === dateStr)
    
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

// Helper functions
function getDayOfWeek(dayName: string): number {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days.indexOf(dayName)
}

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek]
}
