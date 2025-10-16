import { ExecArgs } from "@medusajs/framework/types"

export default async function seedAvailability({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const bookingModuleService = container.resolve("booking")

  try {
    logger.info("Seeding availability data...")

    // Delete all existing availability records first
    const existingAvailabilities = await bookingModuleService.listAvailabilities({})
    logger.info(`Found ${existingAvailabilities.length} existing availability records`)
    
    if (existingAvailabilities.length > 0) {
      for (const avail of existingAvailabilities) {
        await bookingModuleService.deleteAvailabilities(avail.id)
      }
      logger.info("Deleted all existing availability records")
    }

    // Create availability for Monday-Saturday
    const availability = [
      // Monday
      { day_of_week: 1, start_time: "09:00", end_time: "18:00", is_available: true, staff_name: "SkinLair Team" },
      // Tuesday
      { day_of_week: 2, start_time: "09:00", end_time: "18:00", is_available: true, staff_name: "SkinLair Team" },
      // Wednesday
      { day_of_week: 3, start_time: "09:00", end_time: "18:00", is_available: true, staff_name: "SkinLair Team" },
      // Thursday
      { day_of_week: 4, start_time: "09:00", end_time: "18:00", is_available: true, staff_name: "SkinLair Team" },
      // Friday
      { day_of_week: 5, start_time: "09:00", end_time: "18:00", is_available: true, staff_name: "SkinLair Team" },
      // Saturday (shorter hours)
      { day_of_week: 6, start_time: "10:00", end_time: "16:00", is_available: true, staff_name: "SkinLair Team" },
    ]

    for (const slot of availability) {
      const created = await bookingModuleService.createAvailabilities(slot)
      logger.info(`Created availability for day ${slot.day_of_week}: ${JSON.stringify(created)}`)
    }

    // Verify the records were created
    const allAvailabilities = await bookingModuleService.listAvailabilities({})
    logger.info(`✅ Total availability records after seeding: ${allAvailabilities.length}`)
    
    if (allAvailabilities.length > 0) {
      logger.info("Sample availability record:", allAvailabilities[0])
    }

    logger.info("✅ Availability data seeded successfully!")
  } catch (error) {
    logger.error("Error seeding availability data:", error)
    throw error
  }
}

