"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Calendar, Clock, User, Phone, Envelope, Check, XMark, CreditCard, Eye, ArrowLeft, ArrowRight } from "@medusajs/icons"
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

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
]

export default function BookingsDayView() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState("")

  useEffect(() => {
    loadBookings()
  }, [selectedDate])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const response = await fetch(`http://localhost:9000/public/bookings?date=${dateStr}`)
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/store/bookings/${bookingId}/confirm`, {
        method: 'POST',
      })

      if (response.ok) {
        await loadBookings()
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
    }
  }

  const handleRefundBooking = async () => {
    if (!selectedBooking) return

    try {
      const response = await fetch(`/store/bookings/${selectedBooking.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      })

      if (response.ok) {
        await loadBookings()
        setShowRefundModal(false)
        setSelectedBooking(null)
        setRefundReason("")
      }
    } catch (error) {
      console.error('Error refunding booking:', error)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getBookingsForTimeSlot = (timeSlot: string) => {
    return bookings.filter(booking => {
      const bookingTime = booking.scheduled_time
      return bookingTime === timeSlot || bookingTime.startsWith(timeSlot)
    })
  }

  const getBookingStatusColor = (status: string, paymentPaid: boolean) => {
    if (status === 'cancelled') return 'red'
    if (status === 'completed') return 'green'
    if (status === 'confirmed' && paymentPaid) return 'green'
    if (status === 'pending' && paymentPaid) return 'yellow'
    return 'orange'
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Text>Loading bookings...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6" />
          <div>
            <Heading level="h1">Bookings - Day View</Heading>
            <Text className="text-ui-fg-subtle">
              {formatDate(selectedDate)}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigateDate('prev')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigateDate('next')}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day View Grid */}
      <div className="bg-ui-bg-base border border-ui-border-base rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-0">
          {TIME_SLOTS.map((timeSlot) => {
            const slotBookings = getBookingsForTimeSlot(timeSlot)
            const isCurrentTime = new Date().toTimeString().slice(0, 5) === timeSlot
            const isPastTime = new Date().toTimeString().slice(0, 5) > timeSlot

            return (
              <div
                key={timeSlot}
                className={`border-b border-r border-ui-border-base p-4 min-h-[120px] ${
                  isCurrentTime ? 'bg-ui-bg-highlight' : ''
                } ${isPastTime ? 'bg-ui-bg-subtle' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Text className="font-medium text-sm">
                    {formatTime(timeSlot)}
                  </Text>
                  {isCurrentTime && (
                    <Badge color="blue" size="small">Now</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {slotBookings.length === 0 ? (
                    <Text className="text-ui-fg-subtle text-sm">Available</Text>
                  ) : (
                    slotBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-ui-bg-subtle rounded-lg p-3 cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowDetailsModal(true)
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Text className="font-medium text-sm">
                            {booking.customer_name}
                          </Text>
                          <Badge
                            color={getBookingStatusColor(booking.status, booking.payment_paid)}
                            size="small"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <Text className="text-xs text-ui-fg-subtle mb-1">
                          {booking.service_name}
                        </Text>
                        <div className="flex items-center justify-between">
                          <Text className="text-xs text-ui-fg-subtle">
                            {formatTime(booking.scheduled_time)} - {formatTime(booking.end_time)}
                          </Text>
                          <div className="flex items-center gap-1">
                            {booking.payment_paid && (
                              <CreditCard className="w-3 h-3 text-green-600" />
                            )}
                            {booking.status === 'pending' && (
                              <Button
                                variant="transparent"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConfirmBooking(booking.id)
                                }}
                                className="p-1"
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </Button>
                            )}
                            {booking.payment_paid && booking.status !== 'cancelled' && (
                              <Button
                                variant="transparent"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedBooking(booking)
                                  setShowRefundModal(true)
                                }}
                                className="p-1"
                              >
                                <XMark className="w-3 h-3 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking Details Modal */}
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
                <Heading level="h4" className="text-lg-semi mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer Information
                </Heading>
                <div className="grid grid-cols-2 gap-4">
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
                <Heading level="h4" className="text-lg-semi mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Service Information
                </Heading>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Service</Text>
                    <Text className="font-medium">{selectedBooking.service_name}</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Duration</Text>
                    <Text className="font-medium">{selectedBooking.service_duration} minutes</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">Date & Time</Text>
                    <Text className="font-medium">
                      {new Date(selectedBooking.scheduled_date).toLocaleDateString()} at {formatTime(selectedBooking.scheduled_time)}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-sm text-ui-fg-subtle mb-1">End Time</Text>
                    <Text className="font-medium">{formatTime(selectedBooking.end_time)}</Text>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-ui-bg-subtle rounded-lg p-4">
                <Heading level="h4" className="text-lg-semi mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Information
                </Heading>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text className="text-sm text-ui-fg-subtle">Payment Status</Text>
                    <Badge color={selectedBooking.payment_paid ? "green" : "orange"}>
                      {selectedBooking.payment_paid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text className="text-sm text-ui-fg-subtle">Total Amount</Text>
                    <Text className="font-medium">
                      ${(selectedBooking.service_price / 100).toFixed(2)}
                    </Text>
                  </div>
                  {selectedBooking.refund_amount && (
                    <div className="flex items-center justify-between">
                      <Text className="text-sm text-ui-fg-subtle">Refund Amount</Text>
                      <Text className="font-medium text-red-600">
                        -${(selectedBooking.refund_amount / 100).toFixed(2)}
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-ui-bg-subtle rounded-lg p-4">
                  <Heading level="h4" className="text-lg-semi mb-2">Notes</Heading>
                  <Text className="text-sm">{selectedBooking.notes}</Text>
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
              {selectedBooking.status === 'pending' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleConfirmBooking(selectedBooking.id)
                    setShowDetailsModal(false)
                  }}
                >
                  Confirm Booking
                </Button>
              )}
              {selectedBooking.payment_paid && selectedBooking.status !== 'cancelled' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowRefundModal(true)
                  }}
                >
                  Process Refund
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && (
        <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg shadow-xl max-w-md w-full border border-ui-border-base">
            <div className="p-6">
              <Heading level="h3" className="flex items-center gap-2 mb-4 text-ui-fg-error">
                <XMark className="w-5 h-5" />
                Process Refund
              </Heading>
              <Text className="text-sm text-ui-fg-subtle mb-4">
                Are you sure you want to refund this booking? This action cannot be undone.
              </Text>
              
              <div className="mb-4">
                <Text className="text-sm font-medium mb-2">Refund Reason</Text>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRefundModal(false)
                    setSelectedBooking(null)
                    setRefundReason("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRefundBooking}
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

export const config: ReturnType<typeof defineRouteConfig> = {
  label: "Day View",
  icon: Calendar,
}
