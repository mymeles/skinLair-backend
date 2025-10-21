import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"
// import { generateQRCode } from "@lib/utils/qr-code"

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    allowUnregistered: true,
  },
}

export default async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const bookingModuleService = container.resolve(BOOKING_MODULE) as BookingModuleService
  const notificationModuleService = container.resolve("notification")

  try {
    // Get the order details
    const order = await (container.resolve("orderService") as any).retrieve(data.id, {
      relations: ["items", "items.variant", "items.variant.product"]
    })

    // Check if this order contains booking services
    const bookingItems = order.items.filter(item => 
      item.variant?.product?.metadata?.is_booking_service
    )

    if (bookingItems.length === 0) {
      return // No booking services in this order
    }

    // Process each booking service
    for (const item of bookingItems) {
      const serviceId = item.variant.product.metadata.service_id
      const scheduledDate = item.metadata.scheduled_date
      const scheduledTime = item.metadata.scheduled_time

      if (!serviceId || !scheduledDate || !scheduledTime) {
        console.warn(`Missing booking metadata for item ${item.id}`)
        continue
      }

      // Get the service details
      const service = await bookingModuleService.retrieveService(serviceId)
      if (!service) {
        console.warn(`Service ${serviceId} not found`)
        continue
      }

      // Calculate end time
      const startTime = new Date(`${scheduledDate}T${scheduledTime}`)
      const endTime = new Date(startTime.getTime() + service.duration * 60000)

      // Create or update booking
      const existingBooking = await bookingModuleService.listBookings({
        order_id: order.id,
        service_id: serviceId
      })

      let booking
      if (existingBooking.length > 0) {
        // Update existing booking
        booking = await bookingModuleService.updateBookings({
          id: existingBooking[0].id,
          status: "confirmed",
          payment_paid: true,
          order_id: order.id,
        })
      } else {
        // Create new booking
        booking = await bookingModuleService.createBookings({
          customer_id: order.customer_id,
          customer_name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
          customer_email: order.email,
          customer_phone: order.shipping_address?.phone || null,
          service_id: serviceId,
          service_name: service.name,
          service_duration: service.duration,
          service_price: service.price,
          scheduled_date: startTime,
          scheduled_time: scheduledTime,
          end_time: endTime.toTimeString().slice(0, 5),
          status: "confirmed",
          payment_paid: true,
          order_id: order.id,
        })
      }

      // Generate QR code for the booking (placeholder for now)
      const qrCode = `QR_${booking.id}`
      
      // Update booking with QR code
      await bookingModuleService.updateBookings({
        id: booking.id,
        qr_code: qrCode
      })

      // Send confirmation email with QR code
      await (notificationModuleService as any).send({
        to: order.email,
        channel: "email",
        template: "booking-confirmation",
        data: {
          booking: {
            id: booking.id,
            service_name: service.name,
            scheduled_date: startTime.toLocaleDateString(),
            scheduled_time: scheduledTime,
            end_time: endTime.toTimeString().slice(0, 5),
            qr_code: qrCode
          },
          customer: {
            name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
            email: order.email
          }
        }
      })
    }
  } catch (error) {
    console.error("Error processing booking order confirmation:", error)
  }
}
