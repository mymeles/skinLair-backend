import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"

// Booking Stats Widget for Admin Dashboard
const BookingStatsWidget = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Booking Statistics</Heading>
      </div>
      <div className="grid grid-cols-4 gap-4 p-6">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Today's Bookings</span>
          <span className="text-2xl font-bold">12</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Pending</span>
          <span className="text-2xl font-bold text-yellow-600">5</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Confirmed</span>
          <span className="text-2xl font-bold text-green-600">7</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Revenue</span>
          <span className="text-2xl font-bold">$1,240</span>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default BookingStatsWidget
