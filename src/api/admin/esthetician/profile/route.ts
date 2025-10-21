import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

// In a real application, this would come from a database
let estheticianProfile = {
  name: "Dr. Sarah Johnson",
  specialty: "Advanced Skincare & Anti-Aging",
  experience: "8+ years",
  rating: 4.9,
  totalSessions: 1247,
  totalInPersonSessions: 892,
  availability: ["9:00 AM - 5:00 PM", "Monday - Friday"],
  bio: "Certified esthetician specializing in advanced skincare treatments, virtual consultations, and in-person spa services. Your one-stop skincare expert for all treatment needs.",
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService
    
    // Get real statistics from bookings
    const allBookings = await bookingModuleService.listBookings({})
    const totalSessions = allBookings.length
    const totalInPersonSessions = allBookings.filter(booking => 
      !booking.service_name.toLowerCase().includes('virtual')
    ).length
    
    // Update profile with real data
    const profileWithStats = {
      ...estheticianProfile,
      totalSessions,
      totalInPersonSessions
    }
    
    res.json(profileWithStats)
  } catch (error: any) {
    console.error("Error fetching esthetician profile:", error)
    res.status(500).json({ error: error.message || "Failed to fetch profile" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { name, specialty, experience, bio, availability, services } = req.body as any
    
    // Update profile
    estheticianProfile = {
      ...estheticianProfile,
      name: name || estheticianProfile.name,
      specialty: specialty || estheticianProfile.specialty,
      experience: experience || estheticianProfile.experience,
      bio: bio || estheticianProfile.bio,
      availability: availability || estheticianProfile.availability,
      services: services || estheticianProfile.services
    }
    
    res.json({ message: "Profile updated successfully", profile: estheticianProfile })
  } catch (error: any) {
    console.error("Error updating esthetician profile:", error)
    res.status(500).json({ error: error.message || "Failed to update profile" })
  }
}
