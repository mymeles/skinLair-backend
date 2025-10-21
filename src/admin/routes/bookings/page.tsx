"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Calendar, Eye, XMark, Check, Clock, User, Envelope, Calendar as CalendarIcon, CreditCard } from "@medusajs/icons"
import { Container, Heading, Table, Badge, Button, Text, Input, Select, Textarea } from "@medusajs/ui"
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
  payment_paid: boolean
  service_price: number
  notes?: string
  created_at: string
  staff_name?: string
  service_duration?: number
  refund_amount?: number
  refund_reason?: string
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
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [refundEligibility, setRefundEligibility] = useState<any>(null)
  const [forceRefund, setForceRefund] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter, dateFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/public/bookings")
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`)
      }
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
      // Set empty data on error
      setBookings([])
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = [...bookings]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.scheduled_date)
        switch (dateFilter) {
          case "today":
            return bookingDate.toDateString() === today.toDateString()
          case "tomorrow":
            return bookingDate.toDateString() === tomorrow.toDateString()
          case "this_week":
            return bookingDate >= today && bookingDate <= nextWeek
          case "past":
            return bookingDate < today
          default:
            return true
        }
      })
    }

    setFilteredBookings(filtered)
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    try {
      // For now, we'll simulate the update locally
      // In a real app, this would call the API
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, status: "cancelled", notes: cancelReason }
          : booking
      ))

      setShowCancelModal(false)
      setCancelReason("")
      setSelectedBooking(null)
      
      // Show success message
      alert("Booking cancelled successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking")
    }
  }

  const checkRefundEligibility = async (booking: Booking) => {
    try {
      const response = await fetch(`/admin/bookings/${booking.id}/refund-check`)
      if (response.ok) {
        const data = await response.json()
        setRefundEligibility(data)
        setSelectedBooking(booking)
        setShowRefundModal(true)
      } else {
        const error = await response.json()
        alert(`Error checking refund eligibility: ${error.error}`)
      }
    } catch (error) {
      console.error("Error checking refund eligibility:", error)
      alert("Failed to check refund eligibility")
    }
  }

  const handleRefund = async () => {
    if (!selectedBooking) return

    try {
      const response = await fetch(`/admin/bookings/${selectedBooking.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: refundReason,
          force_refund: forceRefund
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        
        // Update booking locally
        setBookings(prev => 
          prev.map(booking => 
            booking.id === selectedBooking.id 
              ? { 
                  ...booking, 
                  status: "cancelled" as const,
                  refund_amount: data.refund_amount,
                  refund_reason: data.refund_policy
                }
              : booking
          )
        )
        
        setFilteredBookings(prev => 
          prev.map(booking => 
            booking.id === selectedBooking.id 
              ? { 
                  ...booking, 
                  status: "cancelled" as const,
                  refund_amount: data.refund_amount,
                  refund_reason: data.refund_policy
                }
              : booking
          )
        )

        setShowRefundModal(false)
        setSelectedBooking(null)
        setRefundReason("")
        setForceRefund(false)
        setRefundEligibility(null)
      } else {
        const error = await response.json()
        alert(`Error processing refund: ${error.error}`)
      }
    } catch (error) {
      console.error("Error processing refund:", error)
      alert("Failed to process refund")
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedBooking) return

    try {
      // For now, we'll simulate the update locally
      // In a real app, this would call the API
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, status: newStatus }
          : booking
      ))

      setShowStatusModal(false)
      setSelectedBooking(null)
      
      // Show success message
      alert(`Booking status updated to ${newStatus} successfully!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking status")
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
        <div>
          <Heading level="h1" className="flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Dr. Sarah Johnson's Appointments
          </Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage all appointments - virtual consultations and in-person spa treatments
          </Text>
        </div>
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

      {/* Search and Filter Controls */}
      <div className="mb-6 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Text className="text-sm font-medium mb-2">Search Bookings</Text>
            <Input
              placeholder="Search by name, email, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Text className="text-sm font-medium mb-2">Status</Text>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger>
                <Select.Value placeholder="All Statuses" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Statuses</Select.Item>
                <Select.Item value="pending">Pending</Select.Item>
                <Select.Item value="confirmed">Confirmed</Select.Item>
                <Select.Item value="completed">Completed</Select.Item>
                <Select.Item value="cancelled">Cancelled</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Text className="text-sm font-medium mb-2">Date Range</Text>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <Select.Trigger>
                <Select.Value placeholder="All Dates" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Dates</Select.Item>
                <Select.Item value="today">Today</Select.Item>
                <Select.Item value="tomorrow">Tomorrow</Select.Item>
                <Select.Item value="this_week">This Week</Select.Item>
                <Select.Item value="past">Past Bookings</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDateFilter("all")
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

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
          <div className="flex items-center justify-between mb-4">
            <Text className="text-sm text-ui-fg-subtle">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </Text>
          </div>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-ui-fg-muted mx-auto mb-4" />
              <Text className="text-ui-fg-muted">No bookings found</Text>
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setDateFilter("all")
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
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
                {filteredBookings.map((booking) => (
                  <Table.Row key={booking.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-ui-bg-subtle rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-ui-fg-muted" />
                        </div>
                        <div>
                          <Text className="font-medium">{booking.customer_name}</Text>
                          <Text className="text-xs text-ui-fg-subtle">{booking.customer_email}</Text>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <Text className="font-medium">{booking.service_name}</Text>
                        {booking.service_duration && (
                          <Text className="text-xs text-ui-fg-subtle flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.service_duration} min
                          </Text>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <Text className="font-medium flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {formatDateTime(booking.scheduled_date, booking.scheduled_time)}
                        </Text>
                        {booking.staff_name && (
                          <Text className="text-xs text-ui-fg-subtle">
                            Staff: {booking.staff_name}
                          </Text>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <Badge color={booking.payment_paid ? "green" : "orange"}>
                          {booking.payment_paid ? "Paid" : "Pending"}
                        </Badge>
                        <Text className="text-xs text-ui-fg-subtle flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          ${(booking.service_price / 100).toFixed(2)}
                        </Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {booking.status !== "cancelled" && booking.status !== "completed" && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowStatusModal(true)
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {booking.status !== "cancelled" && booking.status !== "completed" && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowCancelModal(true)
                            }}
                          >
                            <XMark className="w-4 h-4" />
                          </Button>
                        )}
                        {booking.payment_paid && booking.status !== "cancelled" && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => checkRefundEligibility(booking)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </div>

      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-ui-border-base">
            <div className="sticky top-0 bg-ui-bg-base border-b border-ui-border-base px-6 py-4 flex justify-between items-center">
              <div>
                <Heading level="h3" className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking Details
                </Heading>
                <Text className="text-ui-fg-subtle text-sm">
                  Booking ID: {selectedBooking.id}
                </Text>
              </div>
              <Button
                variant="transparent"
                size="small"
                onClick={() => setShowDetailsModal(false)}
                className="hover:bg-ui-bg-subtle-hover"
              >
                <XMark className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-ui-bg-subtle rounded-lg p-4">
                <Heading level="h4" className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4" />
                  Customer Information
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Full Name</Text>
                    <Text className="font-medium">{selectedBooking.customer_name}</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Email</Text>
                    <Text className="font-medium flex items-center gap-1">
                      <Envelope className="w-3 h-3" />
                      {selectedBooking.customer_email}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Phone</Text>
                    <Text className="font-medium">
                      {selectedBooking.customer_phone || "Not provided"}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Booking Date</Text>
                    <Text className="font-medium">
                      {new Date(selectedBooking.created_at).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="bg-ui-bg-subtle rounded-lg p-4">
                <Heading level="h4" className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" />
                  Service Information
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Service Name</Text>
                    <Text className="font-medium">{selectedBooking.service_name}</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Duration</Text>
                    <Text className="font-medium">
                      {selectedBooking.service_duration ? `${selectedBooking.service_duration} minutes` : 'N/A'}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Scheduled Date</Text>
                    <Text className="font-medium flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(selectedBooking.scheduled_date).toLocaleDateString()}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Time</Text>
                    <Text className="font-medium">
                      {selectedBooking.scheduled_time} - {selectedBooking.end_time}
                    </Text>
                  </div>
                  {selectedBooking.staff_name && (
                    <div>
                      <Text className="text-sm text-ui-fg-subtle mb-1">Assigned Staff</Text>
                      <Text className="font-medium">{selectedBooking.staff_name}</Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ui-bg-subtle rounded-lg p-4">
                  <Heading level="h4" className="mb-3">Status</Heading>
                  <Badge color={getStatusColor(selectedBooking.status)} className="text-sm">
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div className="bg-ui-bg-subtle rounded-lg p-4">
                  <Heading level="h4" className="mb-3">Payment</Heading>
                  <div className="space-y-2">
                    <Badge color={selectedBooking.payment_paid ? "green" : "orange"}>
                      {selectedBooking.payment_paid ? "Paid" : "Pending"}
                    </Badge>
                    <Text className="text-sm text-ui-fg-subtle">
                      Total: ${(selectedBooking.service_price / 100).toFixed(2)}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-ui-bg-subtle rounded-lg p-4">
                  <Heading level="h4" className="mb-3">Notes</Heading>
                  <Text className="text-sm">{selectedBooking.notes}</Text>
                </div>
              )}

              {/* Refund Information */}
              {selectedBooking.refund_amount && (
                <div className="bg-ui-bg-error-subtle rounded-lg p-4">
                  <Heading level="h4" className="mb-3 text-ui-fg-error">Refund Information</Heading>
                  <div className="space-y-2">
                    <Text className="text-sm text-ui-fg-error">
                      Refund Amount: ${(selectedBooking.refund_amount / 100).toFixed(2)}
                    </Text>
                    {selectedBooking.refund_reason && (
                      <Text className="text-sm text-ui-fg-error">
                        Reason: {selectedBooking.refund_reason}
                      </Text>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-ui-bg-base border-t border-ui-border-base px-6 py-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              {selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowStatusModal(true)
                  }}
                >
                  Update Status
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg shadow-xl max-w-md w-full border border-ui-border-base">
            <div className="p-6">
              <Heading level="h3" className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5" />
                Update Booking Status
              </Heading>
              <Text className="text-ui-fg-subtle mb-6">
                Update the status for {selectedBooking.customer_name}'s booking
              </Text>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {["pending", "confirmed", "completed", "cancelled"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedBooking.status === status ? "primary" : "secondary"}
                      onClick={() => handleUpdateStatus(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-ui-border-base px-6 py-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedBooking(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg shadow-xl max-w-md w-full border border-ui-border-base">
            <div className="p-6">
              <Heading level="h3" className="flex items-center gap-2 mb-4 text-ui-fg-error">
                <XMark className="w-5 h-5" />
                Cancel Booking
              </Heading>
              <Text className="text-ui-fg-subtle mb-6">
                Are you sure you want to cancel this booking for {selectedBooking.customer_name}?
              </Text>
              
              <div className="mb-4">
                <Text className="text-sm font-medium mb-2">Reason (optional)</Text>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason..."
                  rows={3}
                />
              </div>
            </div>
            <div className="border-t border-ui-border-base px-6 py-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCancelModal(false)
                  setSelectedBooking(null)
                  setCancelReason("")
                }}
              >
                Keep Booking
              </Button>
              <Button
                variant="primary"
                onClick={handleCancelBooking}
                className="bg-ui-fg-error hover:bg-ui-fg-error-hover"
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && refundEligibility && (
        <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg shadow-xl max-w-md w-full border border-ui-border-base">
            <div className="p-6">
              <Heading level="h3" className="flex items-center gap-2 mb-4 text-orange-600">
                <CreditCard className="w-5 h-5" />
                Process Refund
              </Heading>
              
              <div className="mb-6 space-y-4">
                <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                  <Text className="font-medium mb-2">Refund Eligibility</Text>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Text className="text-sm">Hours until booking:</Text>
                      <Text className="text-sm font-medium">{refundEligibility.hours_until_booking}h</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-sm">Service price:</Text>
                      <Text className="text-sm font-medium">${refundEligibility.service_price}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-sm">Refund amount:</Text>
                      <Text className="text-sm font-medium text-green-600">${refundEligibility.refund_amount}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-sm">Policy:</Text>
                      <Text className="text-sm text-ui-fg-subtle">{refundEligibility.refund_policy}</Text>
                    </div>
                  </div>
                </div>

                <div>
                  <Text className="text-sm font-medium mb-2">Refund Reason (Optional)</Text>
                  <Textarea
                    placeholder="Enter reason for refund..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {!refundEligibility.can_refund && (
                  <div className="p-3 bg-ui-bg-error-subtle border border-ui-border-error rounded-lg">
                    <Text className="text-sm text-ui-fg-error">
                      No refund available due to cancellation policy. 
                      As the esthetician, you can override this policy for special circumstances.
                    </Text>
                    <div className="mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={forceRefund}
                          onChange={(e) => setForceRefund(e.target.checked)}
                          className="rounded"
                        />
                        <Text className="text-sm">Override policy - Full refund (esthetician discretion)</Text>
                      </label>
                    </div>
                  </div>
                )}

                {refundEligibility.can_refund && refundEligibility.refund_amount < refundEligibility.service_price && (
                  <div className="p-3 bg-ui-bg-warning-subtle border border-ui-border-warning rounded-lg">
                    <Text className="text-sm text-ui-fg-warning">
                      Partial refund due to cancellation policy. 
                      You can override to provide full refund if needed.
                    </Text>
                    <div className="mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={forceRefund}
                          onChange={(e) => setForceRefund(e.target.checked)}
                          className="rounded"
                        />
                        <Text className="text-sm">Override policy - Full refund (esthetician discretion)</Text>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRefundModal(false)
                    setSelectedBooking(null)
                    setRefundReason("")
                    setForceRefund(false)
                    setRefundEligibility(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRefund}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Process Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Spa Appointments",
  icon: Calendar,
})

export default BookingManagementPage
