import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// Inline utility functions to avoid import issues
async function syncEstheticianAvailability(
  bookingModuleService: BookingModuleService,
  profile: any
): Promise<void> {
  try {
    // Clear existing availability for this esthetician
    // In a real app, you'd get the esthetician ID from the authenticated user
    const estheticianId = "esthetician-1" // This should come from user authentication
    const existingAvailabilities = await bookingModuleService.listAvailabilities({
      staff_id: estheticianId
    })
    
    for (const availability of existingAvailabilities) {
      await bookingModuleService.deleteAvailabilities(availability.id)
    }

    // Convert working hours to availability records
    for (const workingHour of profile.workingHours) {
      if (workingHour.isWorking) {
        const dayOfWeek = getDayOfWeek(workingHour.day)
        
        await bookingModuleService.createAvailabilities({
          staff_id: estheticianId,
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

function getDayOfWeek(dayName: string): number {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days.indexOf(dayName)
}

// POST - Sync esthetician availability to booking system
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    const estheticianProfile = req.body as {
      name: string
      specialty: string
      experience: string
      rating: number
      totalSessions: number
      totalInPersonSessions: number
      availability: string[]
      bio: string
      services: string[]
      workingHours: Array<{
        day: string
        startTime: string
        endTime: string
        isWorking: boolean
      }>
      blockedDates: Array<{
        id: string
        date: string
        startTime?: string
        endTime?: string
        reason: string
        isAllDay: boolean
      }>
    }

    // Sync the availability data
    await syncEstheticianAvailability(bookingModuleService, estheticianProfile)

    res.json({ 
      success: true, 
      message: "Esthetician availability synced successfully" 
    })
  } catch (error) {
    console.error("Error syncing esthetician availability:", error)
    res.status(500).json({ 
      error: "Failed to sync esthetician availability" 
    })
  }
}

// GET - Get current esthetician availability
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

    // Get current availability records
    // In a real app, you'd get the esthetician ID from the authenticated user
    const estheticianId = "esthetician-1" // This should come from user authentication
    const availabilities = await bookingModuleService.listAvailabilities({
      staff_id: estheticianId
    })

    res.json({ availabilities })
  } catch (error) {
    console.error("Error getting esthetician availability:", error)
    res.status(500).json({ 
      error: "Failed to get esthetician availability" 
    })
  }
}
