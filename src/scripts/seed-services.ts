import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

export default async function seedServices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const bookingModuleService = container.resolve(BOOKING_MODULE) as BookingModuleService

  logger.info("Seeding services data...")

  const services = [
    {
      name: "Virtual Skin Consultation",
      description:
        "A one-on-one video session where we'll review your skin history, current routine, and goals. You'll leave with a clear, personalized at-home plan and product recommendations tailored to your needs.",
      duration: 60, // 45-60 minutes
      price: 9999, // $99.99 in cents
      category: "consultation",
      is_active: true,
      deposit_required: false,
      buffer_time: 15,
      max_advance_booking: 90,
    },
    {
      name: "Custom At-Home Skincare Plan",
      description:
        "Take your results further with a structured skincare plan. This includes a customized morning & evening routine, tailored product recommendations, and weekly email check-ins for accountability and adjustments.",
      duration: 120, // 4 or 12 weeks, but we'll use 120 min as a placeholder
      price: 19999, // $199.99 in cents
      category: "plan",
      is_active: true,
      deposit_required: true,
      deposit_amount: 5000, // $50.00 deposit
      buffer_time: 0,
      max_advance_booking: 90,
    },
    {
      name: "Hormonal & PCOS Skincare Plan",
      description:
        "Designed for clients managing hormonal imbalance or PCOS-related skin concerns. This plan goes deeper, with specialized guidance for hormonal breakouts, texture and oil regulation, and redness management.",
      duration: 120, // 4 or 12 weeks
      price: 24999, // $249.99 in cents
      category: "plan",
      is_active: true,
      deposit_required: true,
      deposit_amount: 7500, // $75.00 deposit
      buffer_time: 0,
      max_advance_booking: 90,
    },
    {
      name: "Follow-Up Sessions",
      description:
        "Already had a consultation? Book a follow-up to review progress, adjust your routine, or address new concerns. Great for staying on track long-term.",
      duration: 30,
      price: 4999, // $49.99 in cents
      category: "consultation",
      is_active: true,
      deposit_required: false,
      buffer_time: 15,
      max_advance_booking: 90,
    },
  ]

  try {
    for (const service of services) {
      // Check if service already exists
      const existing = await bookingModuleService.listServices({
        name: service.name,
      })

      if (existing.length === 0) {
        await bookingModuleService.createServices(service)
        logger.info(`Created service: ${service.name}`)
      } else {
        logger.info(`Service already exists: ${service.name}`)
      }
    }

    logger.info("Finished seeding services data.")
  } catch (error) {
    logger.error(`Error seeding services: ${error}`)
    throw error
  }
}

