import { ExecArgs } from "@medusajs/framework/types"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export default async function seedBookingData({ container }: ExecArgs) {
  console.log("Seeding booking data...")

  try {
    const bookingModuleService = container.resolve(BOOKING_MODULE) as BookingModuleService

    // Create some sample services
    console.log("Creating services...")
    const services = await Promise.all([
      bookingModuleService.createServices({
        name: "HydraFacial",
        description: "Deep cleansing and hydrating facial treatment",
        duration: 60,
        price: 15000, // $150.00 in cents
        category: "Facial Treatments",
        is_active: true,
        buffer_time: 15,
        max_advance_booking: 90,
      }),
      bookingModuleService.createServices({
        name: "Chemical Peel",
        description: "Exfoliating treatment for smoother skin",
        duration: 45,
        price: 12000, // $120.00 in cents
        category: "Facial Treatments",
        is_active: true,
        buffer_time: 10,
        max_advance_booking: 90,
      }),
      bookingModuleService.createServices({
        name: "Microneedling",
        description: "Collagen induction therapy for skin rejuvenation",
        duration: 90,
        price: 20000, // $200.00 in cents
        category: "Advanced Treatments",
        is_active: true,
        buffer_time: 20,
        max_advance_booking: 90,
      }),
      bookingModuleService.createServices({
        name: "Laser Hair Removal",
        description: "Permanent hair reduction treatment",
        duration: 30,
        price: 8000, // $80.00 in cents
        category: "Hair Removal",
        is_active: true,
        buffer_time: 5,
        max_advance_booking: 90,
      })
    ])

    console.log(`Created ${services.length} services`)

    // Create some sample bookings
    console.log("Creating bookings...")
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const bookings = await Promise.all([
      bookingModuleService.createBookings({
        customer_id: "cust_1",
        customer_name: "Sarah Johnson",
        customer_email: "sarah@example.com",
        customer_phone: "+1-555-0123",
        service_id: services[0].id,
        service_name: services[0].name,
        service_duration: services[0].duration,
        service_price: services[0].price,
        scheduled_date: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        scheduled_time: "10:00 AM",
        end_time: "11:00 AM",
        status: "confirmed",
        notes: "First time client",
        staff_id: "staff_1",
        staff_name: "Dr. Smith",
        payment_paid: true,
        reminder_sent: true,
        order_id: "order_1",
        cart_id: "cart_1",
        qr_code: "QR_1",
        checked_in: false,
        checked_in_at: null,
        refund_amount: null,
        refund_reason: null
      }),
      bookingModuleService.createBookings({
        customer_id: "cust_2",
        customer_name: "Emily Davis",
        customer_email: "emily@example.com",
        customer_phone: "+1-555-0124",
        service_id: services[1].id,
        service_name: services[1].name,
        service_duration: services[1].duration,
        service_price: services[1].price,
        scheduled_date: new Date(today.getTime() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
        scheduled_time: "11:30 AM",
        end_time: "12:15 PM",
        status: "pending",
        notes: "Sensitive skin",
        staff_id: "staff_2",
        staff_name: "Dr. Johnson",
        payment_paid: false,
        reminder_sent: false,
        order_id: null,
        cart_id: null,
        qr_code: null,
        checked_in: false,
        checked_in_at: null,
        refund_amount: null,
        refund_reason: null
      }),
      bookingModuleService.createBookings({
        customer_id: "cust_3",
        customer_name: "Lisa Wilson",
        customer_email: "lisa@example.com",
        customer_phone: "+1-555-0125",
        service_id: services[2].id,
        service_name: services[2].name,
        service_duration: services[2].duration,
        service_price: services[2].price,
        scheduled_date: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        scheduled_time: "2:00 PM",
        end_time: "3:30 PM",
        status: "confirmed",
        notes: "Follow-up treatment",
        staff_id: "staff_1",
        staff_name: "Dr. Smith",
        payment_paid: true,
        reminder_sent: true,
        order_id: "order_3",
        cart_id: "cart_3",
        qr_code: "QR_3",
        checked_in: false,
        checked_in_at: null,
        refund_amount: null,
        refund_reason: null
      })
    ])

    console.log(`Created ${bookings.length} bookings`)
    console.log("Booking data seeded successfully!")
  } catch (error) {
    console.error("Error seeding booking data:", error)
    throw error
  }
}
