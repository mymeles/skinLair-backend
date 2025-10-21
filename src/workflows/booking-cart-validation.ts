import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// Add custom validation for booking services in cart
addToCartWorkflow.hooks.validate(
  async ({ input }, { container }) => {
    const items = input.items
    const bookingModuleService = container.resolve(BOOKING_MODULE) as BookingModuleService

    // Check if any items are booking services
    for (const item of items) {
      if (item.metadata?.is_booking_service) {
        const serviceId = item.metadata.service_id
        const scheduledDate = item.metadata.scheduled_date
        const scheduledTime = item.metadata.scheduled_time

        if (!serviceId || !scheduledDate || !scheduledTime) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Booking services require service_id, scheduled_date, and scheduled_time in metadata"
          )
        }

        // Validate service exists and is active
        try {
          const service = await bookingModuleService.retrieveService(serviceId as string)
          if (!service || !service.is_active) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Service ${serviceId} is not available`
            )
          }
        } catch (error) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Invalid service: ${serviceId}`
          )
        }

        // Check availability for the specific time slot
        const isAvailable = await checkBookingAvailability(
          bookingModuleService,
          serviceId as string,
          scheduledDate as string,
          scheduledTime as string
        )

        if (!isAvailable) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Time slot ${scheduledTime} on ${scheduledDate} is not available for this service`
          )
        }
      }
    }
  }
)

async function checkBookingAvailability(
  bookingModuleService: BookingModuleService,
  serviceId: string,
  scheduledDate: string,
  scheduledTime: string
): Promise<boolean> {
  try {
    // Get the service to calculate end time
    const service = await bookingModuleService.retrieveService(serviceId)
    if (!service) return false

    const startTime = new Date(`${scheduledDate}T${scheduledTime}`)
    const endTime = new Date(startTime.getTime() + service.duration * 60000)

    // Inline availability checking function
    async function checkEstheticianAvailability(
      bookingModuleService: BookingModuleService,
      profile: any,
      requestedDate: Date,
      requestedTime: string
    ): Promise<{ available: boolean; reason?: string }> {
      try {
        // Check if date is blocked
        const dateStr = requestedDate.toISOString().split('T')[0]
        const blockedDate = profile.blockedDates.find((bd: any) => bd.date === dateStr)
        
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
        const workingHour = profile.workingHours.find((wh: any) => wh.day === dayName)
        
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

    function getDayName(dayOfWeek: number): string {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[dayOfWeek]
    }
    
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

    // Check esthetician availability
    const availabilityCheck = await checkEstheticianAvailability(
      bookingModuleService,
      estheticianProfile,
      startTime,
      scheduledTime
    )

    if (!availabilityCheck.available) {
      console.log(`Booking not available: ${availabilityCheck.reason}`)
      return false
    }

    // Check for existing bookings in this time slot
    const existingBookings = await bookingModuleService.listBookings({
      service_id: serviceId,
      scheduled_date: {
        $gte: startTime,
        $lte: endTime
      },
      status: { $in: ["pending", "confirmed"] }
    })

    return existingBookings.length === 0
  } catch (error) {
    console.error("Error checking booking availability:", error)
    return false
  }
}
