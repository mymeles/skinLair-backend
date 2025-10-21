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
