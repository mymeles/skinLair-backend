"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Badge, Button, Input, Checkbox } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  category?: string
  is_active: boolean
  deposit_required: boolean
  deposit_amount?: number
  buffer_time: number
  max_advance_booking: number
  created_at: string
}

interface FormData {
  name: string
  description: string
  duration: number
  price: number
  category: string
  is_active: boolean
  deposit_required: boolean
  deposit_amount: number
  buffer_time: number
  max_advance_booking: number
}

const ServiceManagementPage = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    category: "",
    is_active: true,
    deposit_required: false,
    deposit_amount: 0,
    buffer_time: 0,
    max_advance_booking: 90,
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/services")
      if (!response.ok) throw new Error("Failed to fetch services")
      const data = await response.json()
      setServices(data.services || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch services")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/admin/services/${editingId}` : "/admin/services"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to save service (${response.status})`
        throw new Error(errorMessage)
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: "",
        description: "",
        duration: 60,
        price: 0,
        category: "",
        is_active: true,
        deposit_required: false,
        deposit_amount: 0,
        buffer_time: 0,
        max_advance_booking: 90,
      })
      await fetchServices()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save service"
      console.error("Service save error:", errorMsg)
      setError(errorMsg)
    }
  }

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
      category: service.category || "",
      is_active: service.is_active,
      deposit_required: service.deposit_required,
      deposit_amount: service.deposit_amount || 0,
      buffer_time: service.buffer_time,
      max_advance_booking: service.max_advance_booking,
    })
    setEditingId(service.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const response = await fetch(`/admin/services/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete service")
      await fetchServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service")
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      duration: 60,
      price: 0,
      category: "",
      is_active: true,
      deposit_required: false,
      deposit_amount: 0,
      buffer_time: 0,
      max_advance_booking: 90,
    })
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-interactive"></div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-8">
        <Heading level="h1" className="mb-2">
          Services Management
        </Heading>
        <p className="text-ui-fg-subtle">Manage your booking services</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-ui-bg-error-subtle border border-ui-border-error rounded-lg">
          <p className="text-ui-fg-error">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <Button onClick={() => setShowForm(true)} variant="primary">
          Add New Service
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Service" : "Create New Service"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Service Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              />
              <Input
                label="Price (cents)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.deposit_required}
                    onChange={(e) => setFormData({ ...formData, deposit_required: e.target.checked })}
                  />
                  <span>Requires Deposit</span>
                </label>
              </div>
            </div>

            {formData.deposit_required && (
              <Input
                label="Deposit Amount (cents)"
                type="number"
                value={formData.deposit_amount}
                onChange={(e) => setFormData({ ...formData, deposit_amount: parseInt(e.target.value) })}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Buffer Time (minutes)"
                type="number"
                value={formData.buffer_time}
                onChange={(e) => setFormData({ ...formData, buffer_time: parseInt(e.target.value) })}
              />
              <Input
                label="Max Advance Booking (days)"
                type="number"
                value={formData.max_advance_booking}
                onChange={(e) => setFormData({ ...formData, max_advance_booking: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary">
                {editingId ? "Update Service" : "Create Service"}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Duration</Table.HeaderCell>
            <Table.HeaderCell>Price</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Deposit</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Header>
          <Table.Body>
            {services.map((service) => (
              <Table.Row key={service.id}>
                <Table.Cell>{service.name}</Table.Cell>
                <Table.Cell>{service.duration} min</Table.Cell>
                <Table.Cell>${(service.price / 100).toFixed(2)}</Table.Cell>
                <Table.Cell>
                  <Badge variant={service.is_active ? "success" : "danger"}>
                    {service.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {service.deposit_required ? (
                    <span>${(service.deposit_amount || 0) / 100}</span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleEdit(service)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleDelete(service.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Services",
})

export default ServiceManagementPage

