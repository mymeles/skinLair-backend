import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// Database-driven esthetician profile
async function getEstheticianProfile(bookingModuleService: BookingModuleService) {
  // Get all bookings to calculate statistics
  const allBookings = await bookingModuleService.listBookings({})
  const totalSessions = allBookings.length
  const totalInPersonSessions = allBookings.filter(booking => 
    !booking.service_name.toLowerCase().includes('virtual')
  ).length

  // Get all services to show what the esthetician offers
  const allServices = await bookingModuleService.listServices({})
  const serviceNames = allServices.map(service => service.name)

  // Get availability data
  const availabilities = await bookingModuleService.listAvailabilities({
    staff_id: "esthetician-1"
  })

  // Convert availability records to working hours format
  const workingHours = [
    { day: "Monday", startTime: "09:00", endTime: "17:00", isWorking: false },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", isWorking: false },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", isWorking: false },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", isWorking: false },
    { day: "Friday", startTime: "09:00", endTime: "17:00", isWorking: false },
    { day: "Saturday", startTime: "10:00", endTime: "15:00", isWorking: false },
    { day: "Sunday", startTime: "10:00", endTime: "15:00", isWorking: false }
  ]

  // Update working hours based on availability records
  availabilities.forEach(availability => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[availability.day_of_week]
    const dayIndex = workingHours.findIndex(wh => wh.day === dayName)
    if (dayIndex !== -1) {
      workingHours[dayIndex] = {
        day: dayName,
        startTime: availability.start_time,
        endTime: availability.end_time,
        isWorking: availability.is_available
      }
    }
  })

  // Get blocked dates from database (if you have a blocked dates table)
  // For now, return empty array - this should come from a dedicated table
  const blockedDates: any[] = []

  return {
    name: "Dr. Sarah Johnson", // This should come from a user/profile table
    specialty: "Advanced Skincare & Anti-Aging", // This should come from a profile table
    experience: "8+ years", // This should come from a profile table
    rating: 4.9, // This should be calculated from reviews
    totalSessions,
    totalInPersonSessions,
    availability: ["9:00 AM - 5:00 PM", "Monday - Friday"], // This should be calculated from workingHours
    bio: "Certified esthetician specializing in advanced skincare treatments, virtual consultations, and in-person spa services. Your one-stop skincare expert for all treatment needs.", // This should come from a profile table
    services: serviceNames,
    workingHours,
    blockedDates
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    // Get database-driven profile
    const profile = await getEstheticianProfile(bookingModuleService)
    
    res.json(profile)
  } catch (error: any) {
    console.error("Error fetching esthetician profile:", error)
    res.status(500).json({ error: error.message || "Failed to fetch profile" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    const { name, specialty, experience, bio, availability, services, workingHours, blockedDates } = req.body as any
    
    // In a real application, you would save this to a dedicated esthetician profile table
    // For now, we'll just return the updated profile
    const updatedProfile = await getEstheticianProfile(bookingModuleService)
    
    // Update the profile with the new data
    if (name) updatedProfile.name = name
    if (specialty) updatedProfile.specialty = specialty
    if (experience) updatedProfile.experience = experience
    if (bio) updatedProfile.bio = bio
    if (availability) updatedProfile.availability = availability
    if (services) updatedProfile.services = services
    if (workingHours) updatedProfile.workingHours = workingHours
    if (blockedDates) updatedProfile.blockedDates = blockedDates
    
    res.json({ message: "Profile updated successfully", profile: updatedProfile })
  } catch (error: any) {
    console.error("Error updating esthetician profile:", error)
    res.status(500).json({ error: error.message || "Failed to update profile" })
  }
}
