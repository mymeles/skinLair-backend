import { ExecArgs } from "@medusajs/framework/types"
import { loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

export default async function seedSessionTimes({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const bookingModuleService = container.resolve("booking") as any

  logger.info("Seeding session times...")

  try {
    // Get all services
    const services = await bookingModuleService.listServices()
    
    if (services.length === 0) {
      logger.info("No services found. Please seed services first.")
      return
    }

    // Define common session times (Monday to Friday, 9 AM to 5 PM)
    const commonSessionTimes = [
      { start_time: "09:00", end_time: "10:00" },
      { start_time: "10:00", end_time: "11:00" },
      { start_time: "11:00", end_time: "12:00" },
      { start_time: "12:00", end_time: "13:00" },
      { start_time: "13:00", end_time: "14:00" },
      { start_time: "14:00", end_time: "15:00" },
      { start_time: "15:00", end_time: "16:00" },
      { start_time: "16:00", end_time: "17:00" },
    ]

    // Add session times for each service
    for (const service of services) {
      logger.info(`Adding session times for service: ${service.name}`)
      
      // Add Monday to Friday (1-5) session times
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        for (const timeSlot of commonSessionTimes) {
          try {
            await bookingModuleService.createSessionTimes({
              service_id: service.id,
              day_of_week: dayOfWeek,
              start_time: timeSlot.start_time,
              end_time: timeSlot.end_time,
              max_bookings: 1,
              buffer_before: 0,
              buffer_after: 0,
              is_available: true,
            })
          } catch (error) {
            // Skip if session time already exists
            if (!error.message?.includes("duplicate") && !error.message?.includes("unique")) {
              logger.warn(`Failed to create session time for ${service.name}: ${error.message}`)
            }
          }
        }
      }

      // Add Saturday (6) morning session times
      const saturdayTimes = [
        { start_time: "09:00", end_time: "10:00" },
        { start_time: "10:00", end_time: "11:00" },
        { start_time: "11:00", end_time: "12:00" },
        { start_time: "12:00", end_time: "13:00" },
      ]

      for (const timeSlot of saturdayTimes) {
        try {
          await bookingModuleService.createSessionTimes({
            service_id: service.id,
            day_of_week: 6,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
            max_bookings: 1,
            buffer_before: 0,
            buffer_after: 0,
            is_available: true,
          })
        } catch (error) {
          if (!error.message?.includes("duplicate") && !error.message?.includes("unique")) {
            logger.warn(`Failed to create Saturday session time for ${service.name}: ${error.message}`)
          }
        }
      }
    }

    logger.info("Session times seeded successfully!")
  } catch (error) {
    logger.error("Error seeding session times:", error)
    throw error
  }
}
