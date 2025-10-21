import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import BookingModuleService from "@modules/booking/service"

/**
 * Seed script to populate initial booking data
 * Run with: npm run seed
 */
export default async function seedBookingData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Seeding booking data...")

  try {
    // Seed Services
    const services = [
      {
        name: "Classic Facial",
        description: "Deep cleansing facial treatment with extractions and moisturizing mask",
        duration: 60,
        price: 8500, // $85.00
        category: "Facials",
        is_active: true,
        deposit_required: true,
        deposit_amount: 2500,
        buffer_time: 15,
        max_advance_booking: 90,
      },
      {
        name: "Hydrating Facial",
        description: "Ultra-hydrating facial treatment for dry or dehydrated skin",
        duration: 75,
        price: 10500, // $105.00
        category: "Facials",
        is_active: true,
        deposit_required: true,
        deposit_amount: 3000,
        buffer_time: 15,
        max_advance_booking: 90,
      },
      {
        name: "Anti-Aging Facial",
        description: "Advanced anti-aging treatment with peptides and vitamin C",
        duration: 90,
        price: 13500, // $135.00
        category: "Facials",
        is_active: true,
        deposit_required: true,
        deposit_amount: 4000,
        buffer_time: 15,
        max_advance_booking: 90,
      },
      {
        name: "Express Facial",
        description: "Quick 30-minute facial for busy schedules",
        duration: 30,
        price: 5500, // $55.00
        category: "Facials",
        is_active: true,
        deposit_required: false,
        buffer_time: 10,
        max_advance_booking: 60,
      },
      {
        name: "Chemical Peel",
        description: "Professional chemical peel for skin rejuvenation",
        duration: 45,
        price: 12000, // $120.00
        category: "Advanced Treatments",
        is_active: true,
        deposit_required: true,
        deposit_amount: 5000,
        buffer_time: 30,
        max_advance_booking: 90,
      },
      {
        name: "Microdermabrasion",
        description: "Exfoliating treatment to improve skin texture and tone",
        duration: 60,
        price: 11000, // $110.00
        category: "Advanced Treatments",
        is_active: true,
        deposit_required: true,
        deposit_amount: 3500,
        buffer_time: 20,
        max_advance_booking: 90,
      },
      {
        name: "LED Light Therapy",
        description: "Non-invasive treatment using LED light to improve skin health",
        duration: 30,
        price: 6500, // $65.00
        category: "Advanced Treatments",
        is_active: true,
        deposit_required: false,
        buffer_time: 10,
        max_advance_booking: 60,
      },
      {
        name: "Back Facial",
        description: "Deep cleansing treatment for back acne and congestion",
        duration: 60,
        price: 9500, // $95.00
        category: "Body Treatments",
        is_active: true,
        deposit_required: true,
        deposit_amount: 3000,
        buffer_time: 15,
        max_advance_booking: 90,
      },
      {
        name: "Consultation",
        description: "Initial skin consultation and treatment planning",
        duration: 30,
        price: 0, // Free
        category: "Consultation",
        is_active: true,
        deposit_required: false,
        buffer_time: 10,
        max_advance_booking: 30,
      },
    ]

    for (const service of services) {
      await query.graph({
        entity: "service",
        fields: ["id"],
        filters: { name: service.name },
      }).then(async (result: any) => {
        if (!result || result.length === 0) {
          await (container.resolve("booking") as BookingModuleService).createServices(service)
          logger.info(`Created service: ${service.name}`)
        } else {
          logger.info(`Service already exists: ${service.name}`)
        }
      })
    }

    // Seed Availability (Monday-Friday, 9 AM - 6 PM)
    const availability = [
      // Monday
      { day_of_week: 1, start_time: "09:00", end_time: "18:00", is_available: true },
      // Tuesday
      { day_of_week: 2, start_time: "09:00", end_time: "18:00", is_available: true },
      // Wednesday
      { day_of_week: 3, start_time: "09:00", end_time: "18:00", is_available: true },
      // Thursday
      { day_of_week: 4, start_time: "09:00", end_time: "18:00", is_available: true },
      // Friday
      { day_of_week: 5, start_time: "09:00", end_time: "18:00", is_available: true },
      // Saturday (shorter hours)
      { day_of_week: 6, start_time: "10:00", end_time: "16:00", is_available: true },
    ]

    for (const slot of availability) {
      await query.graph({
        entity: "availability",
        fields: ["id"],
        filters: { 
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
        },
      }).then(async (result: any) => {
        if (!result || result.length === 0) {
          await (container.resolve("booking") as BookingModuleService).createAvailabilities({
            ...slot,
            staff_name: "SkinLair Team",
          })
          logger.info(`Created availability for day ${slot.day_of_week}`)
        } else {
          logger.info(`Availability already exists for day ${slot.day_of_week}`)
        }
      })
    }

    logger.info("✅ Booking data seeded successfully!")
    logger.info("🎉 You can now start booking appointments!")
  } catch (error) {
    logger.error("Error seeding booking data:", error)
    throw error
  }
}
