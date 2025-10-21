"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Clock, Plus, XMark, PencilSquare, Trash } from "@medusajs/icons"
import { Container, Heading, Table, Badge, Button, Text, Input, Select, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface SessionTime {
  id: string
  service_id: string
  service_name?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  max_bookings: number
  buffer_before: number
  buffer_after: number
  created_at: string
}

interface Service {
  id: string
  name: string
}

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

export default function SessionTimesPage() {
  const [sessionTimes, setSessionTimes] = useState<SessionTime[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSessionTime, setEditingSessionTime] = useState<SessionTime | null>(null)
  const [selectedService, setSelectedService] = useState<string>("")
  const [filteredSessionTimes, setFilteredSessionTimes] = useState<SessionTime[]>([])

  // Form state
  const [formData, setFormData] = useState({
    service_id: "",
    day_of_week: 1,
    start_time: "09:00",
    end_time: "10:00",
    is_available: true,
    max_bookings: 1,
    buffer_before: 0,
    buffer_after: 0,
  })

  useEffect(() => {
    loadSessionTimes()
    loadServices()
  }, [])

  useEffect(() => {
    if (selectedService) {
      setFilteredSessionTimes(sessionTimes.filter(st => st.service_id === selectedService))
    } else {
      setFilteredSessionTimes(sessionTimes)
    }
  }, [sessionTimes, selectedService])

  const loadSessionTimes = async () => {
    try {
      const response = await fetch('/admin/session-times')
      const data = await response.json()
      setSessionTimes(data.session_times || [])
    } catch (error) {
      console.error('Error loading session times:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const response = await fetch('/admin/services')
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  const handleAddSessionTime = async () => {
    try {
      const response = await fetch('/admin/session-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadSessionTimes()
        setShowAddModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error adding session time:', error)
    }
  }

  const handleEditSessionTime = async () => {
    if (!editingSessionTime) return

    try {
      const response = await fetch(`/admin/session-times/${editingSessionTime.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadSessionTimes()
        setShowEditModal(false)
        setEditingSessionTime(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error updating session time:', error)
    }
  }

  const handleDeleteSessionTime = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session time?')) return

    try {
      const response = await fetch(`/admin/session-times/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadSessionTimes()
      }
    } catch (error) {
      console.error('Error deleting session time:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      service_id: "",
      day_of_week: 1,
      start_time: "09:00",
      end_time: "10:00",
      is_available: true,
      max_bookings: 1,
      buffer_before: 0,
      buffer_after: 0,
    })
  }

  const openEditModal = (sessionTime: SessionTime) => {
    setEditingSessionTime(sessionTime)
    setFormData({
      service_id: sessionTime.service_id,
      day_of_week: sessionTime.day_of_week,
      start_time: sessionTime.start_time,
      end_time: sessionTime.end_time,
      is_available: sessionTime.is_available,
      max_bookings: sessionTime.max_bookings,
      buffer_before: sessionTime.buffer_before,
      buffer_after: sessionTime.buffer_after,
    })
    setShowEditModal(true)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Text>Loading session times...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6" />
          <div>
            <Heading level="h1">Session Times</Heading>
            <Text className="text-ui-fg-subtle">
              Manage available time slots for services
            </Text>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Time Slot
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Select
            value={selectedService}
            onValueChange={setSelectedService}
          >
            <Select.Trigger>
              <Select.Value placeholder="Filter by service" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">All Services</Select.Item>
              {services.map((service) => (
                <Select.Item key={service.id} value={service.id}>
                  {service.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>

      {/* Session Times Table */}
      <div className="bg-ui-bg-base border border-ui-border-base rounded-lg overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Service</Table.HeaderCell>
              <Table.HeaderCell>Day</Table.HeaderCell>
              <Table.HeaderCell>Time</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Max Bookings</Table.HeaderCell>
              <Table.HeaderCell>Buffer</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredSessionTimes.map((sessionTime) => (
              <Table.Row key={sessionTime.id}>
                <Table.Cell>
                  <Text className="font-medium">
                    {sessionTime.service_name || 'Unknown Service'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{DAYS[sessionTime.day_of_week]}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>
                    {formatTime(sessionTime.start_time)} - {formatTime(sessionTime.end_time)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={sessionTime.is_available ? "green" : "red"}>
                    {sessionTime.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text>{sessionTime.max_bookings}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text className="text-sm text-ui-fg-subtle">
                    {sessionTime.buffer_before}min before, {sessionTime.buffer_after}min after
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => openEditModal(sessionTime)}
                    >
                      <PencilSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleDeleteSessionTime(sessionTime.id)}
                      className="text-ui-fg-error hover:bg-ui-bg-error-subtle"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Add Session Time Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg shadow-xl max-w-md w-full border border-ui-border-base">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Heading level="h3">Add Time Slot</Heading>
                <Button
                  variant="transparent"
                  size="small"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                >
                  <XMark className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Text className="text-sm font-medium mb-2">Service</Text>
                  <Select
                    value={formData.service_id}
                    onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select service" />
                    </Select.Trigger>
                    <Select.Content>
                      {services.map((service) => (
                        <Select.Item key={service.id} value={service.id}>
                          {service.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                <div>
                  <Text className="text-sm font-medium mb-2">Day of Week</Text>
                  <Select
                    value={formData.day_of_week.toString()}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {DAYS.map((day, index) => (
                        <Select.Item key={index} value={index.toString()}>
                          {day}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm font-medium mb-2">Start Time</Text>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Text className="text-sm font-medium mb-2">End Time</Text>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm font-medium mb-2">Max Bookings</Text>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_bookings}
                      onChange={(e) => setFormData({ ...formData, max_bookings: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="rounded"
                    />
                    <Text className="text-sm">Available</Text>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm font-medium mb-2">Buffer Before (min)</Text>
                    <Input
                      type="number"
                      min="0"
                      value={formData.buffer_before}
                      onChange={(e) => setFormData({ ...formData, buffer_before: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Text className="text-sm font-medium mb-2">Buffer After (min)</Text>
                    <Input
                      type="number"
                      min="0"
                      value={formData.buffer_after}
                      onChange={(e) => setFormData({ ...formData, buffer_after: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddSessionTime}>
                  Add Time Slot
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Time Modal */}
      {showEditModal && editingSessionTime && (
        <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg shadow-xl max-w-md w-full border border-ui-border-base">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Heading level="h3">Edit Time Slot</Heading>
                <Button
                  variant="transparent"
                  size="small"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingSessionTime(null)
                    resetForm()
                  }}
                >
                  <XMark className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Text className="text-sm font-medium mb-2">Service</Text>
                  <Select
                    value={formData.service_id}
                    onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select service" />
                    </Select.Trigger>
                    <Select.Content>
                      {services.map((service) => (
                        <Select.Item key={service.id} value={service.id}>
                          {service.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                <div>
                  <Text className="text-sm font-medium mb-2">Day of Week</Text>
                  <Select
                    value={formData.day_of_week.toString()}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {DAYS.map((day, index) => (
                        <Select.Item key={index} value={index.toString()}>
                          {day}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm font-medium mb-2">Start Time</Text>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Text className="text-sm font-medium mb-2">End Time</Text>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm font-medium mb-2">Max Bookings</Text>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_bookings}
                      onChange={(e) => setFormData({ ...formData, max_bookings: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_available_edit"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="rounded"
                    />
                    <Text className="text-sm">Available</Text>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm font-medium mb-2">Buffer Before (min)</Text>
                    <Input
                      type="number"
                      min="0"
                      value={formData.buffer_before}
                      onChange={(e) => setFormData({ ...formData, buffer_before: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Text className="text-sm font-medium mb-2">Buffer After (min)</Text>
                    <Input
                      type="number"
                      min="0"
                      value={formData.buffer_after}
                      onChange={(e) => setFormData({ ...formData, buffer_after: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingSessionTime(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditSessionTime}>
                  Update Time Slot
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
  label: "Session Times",
  icon: Clock,
}
