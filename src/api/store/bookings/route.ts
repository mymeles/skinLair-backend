import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import { sendBookingConfirmation } from "@modules/notification/email-service"

// GET all bookings (with filters)
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const { customer_email, status, date_from, date_to } = req.query

  const filters: any = {}
  
  if (customer_email) {
    filters.customer_email = customer_email
  }
  
  if (status) {
    filters.status = status
  }

  if (date_from || date_to) {
    filters.scheduled_date = {}
    if (date_from) {
      filters.scheduled_date.$gte = new Date(date_from as string)
    }
    if (date_to) {
      filters.scheduled_date.$lte = new Date(date_to as string)
    }
  }

  const bookings = await bookingModuleService.listBookings(filters, {
    relations: [],
    order: { scheduled_date: "ASC" }
  })

  res.json({ bookings })
}

// POST create new booking
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const {
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    service_id,
    scheduled_date,
    scheduled_time,
    notes,
    staff_id,
  } = req.body as {
    customer_id?: string
    customer_name?: string
    customer_email?: string
    customer_phone?: string
    service_id?: string
    scheduled_date?: string
    scheduled_time?: string
    notes?: string
    staff_id?: string
  }

  // Validate required fields
  if (!customer_name || !customer_email || !service_id || !scheduled_date || !scheduled_time) {
    return res.status(400).json({
      error: "Missing required fields: customer_name, customer_email, service_id, scheduled_date, scheduled_time"
    })
  }

  // Get service details
  const service = await bookingModuleService.retrieveService(service_id)
  
  if (!service) {
    return res.status(404).json({ error: "Service not found" })
  }

  // Calculate end time
  const [hours, minutes] = scheduled_time.split(':').map(Number)
  const endMinutes = (hours * 60 + minutes + service.duration) % (24 * 60)
  const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

  // Check for conflicts
  const existingBookings = await bookingModuleService.listBookings({
    scheduled_date: new Date(scheduled_date),
    status: { $in: ["pending", "confirmed"] },
  })

  const hasConflict = existingBookings.some((booking: any) => {
    if (staff_id && booking.staff_id && booking.staff_id !== staff_id) {
      return false
    }
    const bookingStart = booking.scheduled_time
    const bookingEnd = booking.end_time
    return (
      (scheduled_time >= bookingStart && scheduled_time < bookingEnd) ||
      (endTime > bookingStart && endTime <= bookingEnd) ||
      (scheduled_time <= bookingStart && endTime >= bookingEnd)
    )
  })

  if (hasConflict) {
    return res.status(409).json({
      error: "Time slot not available. Please choose another time."
    })
  }

  // Create booking
  const booking = await bookingModuleService.createBookings({
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    service_id,
    service_name: service.name,
    service_duration: service.duration,
    service_price: service.price,
    scheduled_date: new Date(scheduled_date),
    scheduled_time,
    end_time: endTime,
    notes,
    staff_id,
    status: "pending",
    deposit_paid: false,
    deposit_amount: service.deposit_required ? service.deposit_amount : null,
  })

  // Send confirmation email
  try {
    await sendBookingConfirmation(booking)
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError)
    // Don't fail the booking if email fails
  }

  res.status(201).json({ booking })
}
