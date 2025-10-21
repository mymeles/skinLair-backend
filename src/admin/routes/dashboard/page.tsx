"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Clock, 
  Star, 
  Sparkles,
  UserGroup,
} from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface SpaStats {
  todayBookings: number
  totalClients: number
  monthlyRevenue: number
  averageRating: number
  virtualConsultations: number
  upcomingAppointments: number
  popularServices: Array<{
    name: string
    bookings: number
    revenue: number
  }>
  recentBookings: Array<{
    id: string
    clientName: string
    service: string
    time: string
    status: string
  }>
}

export const config = defineRouteConfig({
  label: "Spa Dashboard",
  icon: Sparkles,
})

export default function SpaDashboard() {
  const [stats, setStats] = useState<SpaStats>({
    todayBookings: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    virtualConsultations: 0,
    upcomingAppointments: 0,
    popularServices: [],
    recentBookings: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Try to load real data from public API endpoints
      const [bookingsResponse, servicesResponse] = await Promise.allSettled([
        fetch("http://localhost:9000/public/bookings"),
        fetch("http://localhost:9000/public/services")
      ])
      
      let bookings = []
      let services = []
      
      if (bookingsResponse.status === "fulfilled" && bookingsResponse.value.ok) {
        const bookingsData = await bookingsResponse.value.json()
        bookings = bookingsData.bookings || []
      }
      
      if (servicesResponse.status === "fulfilled" && servicesResponse.value.ok) {
        const servicesData = await servicesResponse.value.json()
        services = servicesData.services || []
      }
      
      // Calculate stats from real data
      const today = new Date().toISOString().split('T')[0]
      const todayBookings = bookings.filter((b: any) => 
        b.scheduled_date && b.scheduled_date.startsWith(today)
      ).length
      
      const totalClients = new Set(bookings.map((b: any) => b.customer_id)).size
      
      const monthlyRevenue = bookings
        .filter((b: any) => b.payment_paid)
        .reduce((sum: number, b: any) => sum + (b.service_price || 0), 0)
      
      const popularServices = services
        .slice(0, 4)
        .map((service: any) => ({
          name: service.name,
          bookings: bookings.filter((b: any) => b.service_id === service.id).length,
          revenue: bookings
            .filter((b: any) => b.service_id === service.id && b.payment_paid)
            .reduce((sum: number, b: any) => sum + (b.service_price || 0), 0)
        }))
      
      const recentBookings = bookings
        .slice(0, 5)
        .map((booking: any) => ({
          id: booking.id,
          customer: booking.customer_name,
          service: booking.service_name,
          time: booking.scheduled_time,
          status: booking.status
        }))
      
      setStats({
        todayBookings,
        totalClients,
        monthlyRevenue,
        averageRating: 4.8, // This would come from reviews/ratings
        virtualConsultations: bookings.filter((b: any) => b.notes?.includes('virtual')).length,
        upcomingAppointments: bookings.filter((b: any) => 
          b.status === 'confirmed' && new Date(b.scheduled_date) > new Date()
        ).length,
        popularServices,
        recentBookings
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set default stats on error
      setStats({
        todayBookings: 0,
        totalClients: 0,
        monthlyRevenue: 0,
        averageRating: 0,
        virtualConsultations: 0,
        upcomingAppointments: 0,
        popularServices: [],
        recentBookings: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-ui-bg-subtle rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-ui-bg-subtle rounded"></div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold text-ui-fg-base">
            Spa Dashboard
          </Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Welcome back! Here's what's happening at your spa today.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-ui-fg-muted" />
          <Text className="text-sm text-ui-fg-muted">Virtual Esthetician Ready</Text>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Today's Appointments</Text>
              <Text className="text-2xl font-bold text-ui-fg-base">{stats.todayBookings}</Text>
            </div>
            <Calendar className="w-8 h-8 text-ui-fg-muted" />
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Total Clients</Text>
              <Text className="text-2xl font-bold text-ui-fg-base">{stats.totalClients}</Text>
            </div>
            <Users className="w-8 h-8 text-ui-fg-muted" />
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Monthly Revenue</Text>
              <Text className="text-2xl font-bold text-ui-fg-base">
                ${stats.monthlyRevenue.toLocaleString()}
              </Text>
            </div>
            <CreditCard className="w-8 h-8 text-ui-fg-muted" />
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Average Rating</Text>
              <div className="flex items-center gap-1">
                <Text className="text-2xl font-bold text-ui-fg-base">{stats.averageRating}</Text>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
            </div>
            <Star className="w-8 h-8 text-ui-fg-muted" />
          </div>
        </div>
      </div>

      {/* Virtual Esthetician Section */}
      <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <Heading level="h2" className="text-xl font-semibold">
              Virtual Esthetician
            </Heading>
          </div>
          <Badge color="green">Online</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-ui-bg-subtle rounded-lg">
            <UserGroup className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <Text className="font-semibold">Virtual Consultations</Text>
            <Text className="text-2xl font-bold text-purple-600">{stats.virtualConsultations}</Text>
            <Text className="text-sm text-ui-fg-subtle">This month</Text>
          </div>
          
          <div className="text-center p-4 bg-ui-bg-subtle rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <Text className="font-semibold">Upcoming Sessions</Text>
            <Text className="text-2xl font-bold text-blue-600">{stats.upcomingAppointments}</Text>
            <Text className="text-sm text-ui-fg-subtle">Next 24 hours</Text>
          </div>
          
          <div className="text-center p-4 bg-ui-bg-subtle rounded-lg">
            <div className="w-8 h-8 text-green-600 mx-auto mb-2">📈</div>
            <Text className="font-semibold">Client Satisfaction</Text>
            <Text className="text-2xl font-bold text-green-600">98%</Text>
            <Text className="text-sm text-ui-fg-subtle">Virtual sessions</Text>
          </div>
        </div>
      </div>

      {/* Popular Services & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <Heading level="h3" className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-5 h-5">📊</div>
            Popular Services
          </Heading>
          <div className="space-y-3">
            {stats.popularServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-ui-bg-subtle rounded-lg">
                <div>
                  <Text className="font-medium">{service.name}</Text>
                  <Text className="text-sm text-ui-fg-subtle">{service.bookings} bookings</Text>
                </div>
                <div className="text-right">
                  <Text className="font-semibold text-green-600">
                    ${service.revenue.toLocaleString()}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <Heading level="h3" className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Bookings
          </Heading>
          <div className="space-y-3">
            {stats.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-ui-bg-subtle rounded-lg">
                <div>
                  <Text className="font-medium">{booking.clientName}</Text>
                  <Text className="text-sm text-ui-fg-subtle">{booking.service}</Text>
                </div>
                <div className="text-right">
                  <Text className="text-sm">{booking.time}</Text>
                  <Badge 
                    color={booking.status === 'confirmed' ? 'green' : 'orange'}
                    className="text-xs"
                  >
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
