"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Calendar } from "@medusajs/icons"
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface Booking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_name: string
  service_id: string
  scheduled_date: string
  scheduled_time: string
  end_time: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  deposit_paid: boolean
  deposit_amount?: number
  service_price: number
  notes?: string
  created_at: string
}

interface Stats {
  total: number
  pending: number
  confirmed: number
  cancelled: number
  completed: number
}

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/bookings")
      if (!response.ok) throw new Error("Failed to fetch bookings")
      const data = await response.json()
      setBookings(data.bookings || [])

      // Calculate stats
      const bookingList = data.bookings || []
      setStats({
        total: bookingList.length,
        pending: bookingList.filter((b: Booking) => b.status === "pending").length,
        confirmed: bookingList.filter((b: Booking) => b.status === "confirmed").length,
        cancelled: bookingList.filter((b: Booking) => b.status === "cancelled").length,
        completed: bookingList.filter((b: Booking) => b.status === "completed").length,
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    try {
      const response = await fetch(`/admin/bookings/${selectedBooking.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Failed to cancel booking")
      }

      setShowCancelModal(false)
      setCancelReason("")
      setSelectedBooking(null)
      await fetchBookings()
    } catch (err) {
      console.error("Cancel booking error:", err)
      setError(err instanceof Error ? err.message : "Failed to cancel booking")
    }
  }

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString).toLocaleDateString()
    return `${date} - ${timeString}`
  }

  const getStatusColor = (status: string): "green" | "red" | "blue" | "orange" | "grey" | "purple" | undefined => {
    switch (status) {
      case "confirmed":
        return "green"
      case "pending":
        return "orange"
      case "cancelled":
        return "red"
      case "completed":
        return "blue"
      default:
        return "grey"
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Heading level="h1">Booking Management</Heading>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base animate-pulse">
              <div className="h-4 bg-ui-bg-disabled rounded mb-2"></div>
              <div className="h-8 bg-ui-bg-disabled rounded mb-2"></div>
              <div className="h-3 bg-ui-bg-disabled rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base animate-pulse">
          <div className="p-4 border-b border-ui-border-base">
            <div className="h-6 bg-ui-bg-disabled rounded w-1/4"></div>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-ui-bg-disabled rounded"></div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Booking Management</Heading>
        <Button onClick={fetchBookings} variant="secondary">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-ui-bg-error-subtle border border-ui-border-error rounded-lg flex justify-between items-center">
          <div>
            <p className="text-ui-fg-error font-medium">Error Loading Bookings</p>
            <p className="text-ui-fg-error text-sm mt-1">{error}</p>
          </div>
          <Button
            onClick={fetchBookings}
            variant="primary"
            className="whitespace-nowrap ml-4"
          >
            Retry
          </Button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Total Bookings</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-ui-fg-muted mt-1">All time</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Pending</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Awaiting confirmation</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Confirmed</div>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Scheduled</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Completed</div>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Finished</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Cancelled</div>
          </div>
        </div>
      )}

      <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <div className="p-4 border-b">
          <Heading level="h2">All Bookings</Heading>
        </div>
        <div className="p-4">
          {bookings.length === 0 ? (
            <p className="text-gray-500">No bookings found</p>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Service</Table.HeaderCell>
                  <Table.HeaderCell>Date & Time</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Payment</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {bookings.map((booking) => (
                  <Table.Row key={booking.id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium">{booking.customer_name}</p>
                        <p className="text-xs text-gray-500">{booking.customer_email}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{booking.service_name}</Table.Cell>
                    <Table.Cell>{formatDateTime(booking.scheduled_date, booking.scheduled_time)}</Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={booking.deposit_paid ? "green" : "orange"}>
                        {booking.deposit_paid ? "Paid" : "Pending"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowDetailsModal(true)
                        }}
                        className="text-sm text-blue-600 hover:underline mr-2"
                      >
                        View
                      </button>
                      {booking.status !== "cancelled" && booking.status !== "completed" && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowCancelModal(true)
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </div>

      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{selectedBooking.customer_name}</p>
                <p className="text-xs text-gray-500">{selectedBooking.customer_email}</p>
                <p className="text-xs text-gray-500">{selectedBooking.customer_phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Service</p>
                <p className="font-medium">{selectedBooking.service_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Date & Time</p>
                <p className="font-medium">{formatDateTime(selectedBooking.scheduled_date, selectedBooking.scheduled_time)}</p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-medium">{selectedBooking.scheduled_time} - {selectedBooking.end_time}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge color={getStatusColor(selectedBooking.status)}>
                  {selectedBooking.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Payment Status</p>
                <Badge color={selectedBooking.deposit_paid ? "green" : "orange"}>
                  {selectedBooking.deposit_paid ? "Paid" : "Pending"}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Price</p>
                <p className="font-medium">${selectedBooking.service_price.toFixed(2)}</p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <p className="text-gray-500">Notes</p>
                  <p className="font-medium">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cancel Booking</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this booking for {selectedBooking.customer_name}?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Cancellation reason..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setSelectedBooking(null)
                  setCancelReason("")
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Bookings",
  icon: Calendar,
})

export default BookingManagementPage
