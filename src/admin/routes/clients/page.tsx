"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Users, 
  Calendar, 
  Star, 
  Phone, 
  Eye,
  Plus,
  MagnifyingGlass,
} from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button, Input, Table, Modal } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  joinDate: string
  totalBookings: number
  totalSpent: number
  lastVisit: string
  skinType: string
  concerns: string[]
  allergies: string[]
  notes: string
  rating: number
  status: 'active' | 'inactive' | 'vip'
}

export const config = defineRouteConfig({
  label: "Clients",
  icon: Users,
})

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    skinType: "",
    concerns: "",
    allergies: "",
    notes: "",
    status: "active" as 'active' | 'inactive' | 'vip'
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      // Fetch real bookings from API to extract client data
      const response = await fetch("/public/bookings")
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`)
      }
      const data = await response.json()
      
      // Extract unique clients from bookings
      const clientMap = new Map()
      const bookings = data.bookings || []
      
      bookings.forEach((booking: any) => {
        const email = booking.customer_email
        if (!clientMap.has(email)) {
          clientMap.set(email, {
            id: booking.customer_id || email,
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone || "N/A",
            joinDate: booking.created_at?.split('T')[0] || "N/A",
            totalBookings: 0,
            totalSpent: 0,
            lastVisit: booking.scheduled_date?.split('T')[0] || "N/A",
            skinType: "Unknown",
            concerns: [],
            allergies: [],
            notes: booking.notes || "",
            rating: 4.5,
            status: "active" as 'active' | 'inactive' | 'vip'
          })
        }
        
        const client = clientMap.get(email)
        client.totalBookings += 1
        client.totalSpent += booking.service_price || 0
      })
      
      const clientsData = Array.from(clientMap.values())
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading clients:', error)
      // Set empty array on error
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || client.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'purple'
      case 'active': return 'green'
      case 'inactive': return 'gray'
      default: return 'gray'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  const handleEditClient = () => {
    if (!selectedClient) return
    
    setEditForm({
      name: selectedClient.name,
      email: selectedClient.email,
      phone: selectedClient.phone,
      skinType: selectedClient.skinType,
      concerns: selectedClient.concerns.join(", "),
      allergies: selectedClient.allergies.join(", "),
      notes: selectedClient.notes,
      status: selectedClient.status
    })
    setShowEditForm(true)
  }

  const handleSaveClient = () => {
    if (!selectedClient) return
    
    // Update the client in the local state
    setClients(prev => prev.map(client => 
      client.id === selectedClient.id 
        ? {
            ...client,
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            skinType: editForm.skinType,
            concerns: editForm.concerns.split(", ").filter(c => c.trim()),
            allergies: editForm.allergies.split(", ").filter(a => a.trim()),
            notes: editForm.notes,
            status: editForm.status
          }
        : client
    ))
    
    setShowEditForm(false)
    alert("Client updated successfully!")
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-ui-bg-subtle rounded w-1/3"></div>
          <div className="h-64 bg-ui-bg-subtle rounded"></div>
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
            Client Management
          </Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage your spa clients and their treatment history
          </Text>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats divs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Total Clients</Text>
              <Text className="text-2xl font-bold">{clients.length}</Text>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">VIP Clients</Text>
              <Text className="text-2xl font-bold text-purple-600">
                {clients.filter(c => c.status === 'vip').length}
              </Text>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Active Clients</Text>
              <Text className="text-2xl font-bold text-green-600">
                {clients.filter(c => c.status === 'active').length}
              </Text>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Avg. Rating</Text>
              <div className="flex items-center gap-1">
                <Text className="text-2xl font-bold">
                  {(clients.reduce((sum, c) => sum + c.rating, 0) / clients.length).toFixed(1)}
                </Text>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-ui-fg-muted" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 text-ui-fg-muted">⚙️</div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-base"
            >
              <option value="all">All Clients</option>
              <option value="vip">VIP</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Client</Table.HeaderCell>
              <Table.HeaderCell>Contact</Table.HeaderCell>
              <Table.HeaderCell>Skin Type</Table.HeaderCell>
              <Table.HeaderCell>Bookings</Table.HeaderCell>
              <Table.HeaderCell>Total Spent</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredClients.map((client) => (
              <Table.Row key={client.id}>
                <Table.Cell>
                  <div>
                    <Text className="font-medium">{client.name}</Text>
                    <Text className="text-sm text-ui-fg-subtle">
                      Joined {formatDate(client.joinDate)}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 text-ui-fg-muted">📧</div>
                      <Text className="text-sm">{client.email}</Text>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-ui-fg-muted" />
                      <Text className="text-sm">{client.phone}</Text>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Text className="text-sm">{client.skinType}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="text-center">
                    <Text className="font-medium">{client.totalBookings}</Text>
                    <Text className="text-xs text-ui-fg-subtle">
                      Last: {formatDate(client.lastVisit)}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Text className="font-medium">{formatCurrency(client.totalSpent)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={getStatusColor(client.status)}>
                    {client.status.toUpperCase()}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => {
                        setSelectedClient(client)
                        setShowModal(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="transparent"
                      size="small"
                    >
                      <div className="w-4 h-4">✏️</div>
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Client Details Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto bg-ui-bg-base rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between mb-6">
              <Heading level="h3">Client Details</Heading>
              <Button
                variant="transparent"
                onClick={() => setShowModal(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Name</Text>
                  <Text className="font-semibold">{selectedClient.name}</Text>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Status</Text>
                  <Badge color={getStatusColor(selectedClient.status)}>
                    {selectedClient.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Email</Text>
                  <Text>{selectedClient.email}</Text>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Phone</Text>
                  <Text>{selectedClient.phone}</Text>
                </div>
              </div>

              {/* Skin Information */}
              <div>
                <Heading level="h4" className="text-lg font-semibold mb-3">Skin Information</Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm font-medium text-ui-fg-subtle">Skin Type</Text>
                    <Text>{selectedClient.skinType}</Text>
                  </div>
                  <div>
                    <Text className="text-sm font-medium text-ui-fg-subtle">Rating</Text>
                    <div className="flex items-center gap-1">
                      <Text className="font-semibold">{selectedClient.rating}</Text>
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Text className="text-sm font-medium text-ui-fg-subtle">Concerns</Text>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedClient.concerns.map((concern, index) => (
                      <Badge key={index} color="blue">{concern}</Badge>
                    ))}
                  </div>
                </div>
                
                {selectedClient.allergies.length > 0 && (
                  <div className="mt-4">
                    <Text className="text-sm font-medium text-ui-fg-subtle">Allergies</Text>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedClient.allergies.map((allergy, index) => (
                        <Badge key={index} color="red">{allergy}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Treatment History */}
              <div>
                <Heading level="h4" className="text-lg font-semibold mb-3">Treatment History</Heading>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Text className="text-sm font-medium text-ui-fg-subtle">Total Bookings</Text>
                    <Text className="text-2xl font-bold">{selectedClient.totalBookings}</Text>
                  </div>
                  <div>
                    <Text className="text-sm font-medium text-ui-fg-subtle">Total Spent</Text>
                    <Text className="text-2xl font-bold">{formatCurrency(selectedClient.totalSpent)}</Text>
                  </div>
                  <div>
                    <Text className="text-sm font-medium text-ui-fg-subtle">Last Visit</Text>
                    <Text className="text-lg font-semibold">{formatDate(selectedClient.lastVisit)}</Text>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedClient.notes && (
                <div>
                  <Heading level="h4" className="text-lg font-semibold mb-3">Notes</Heading>
                  <div className="p-4 bg-ui-bg-subtle rounded-lg">
                    <Text>{selectedClient.notes}</Text>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-ui-border-base">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={handleEditClient}>
                  <div className="w-4 h-4 mr-2">✏️</div>
                  Edit Client
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditForm && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h3" className="text-lg font-semibold">
                Edit Client: {selectedClient.name}
              </Heading>
              <Button
                variant="transparent"
                size="small"
                onClick={handleCancelEdit}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Client Name"
                />
                <Input
                  label="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'vip' }))}
                    className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Input
                  label="Skin Type"
                  value={editForm.skinType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, skinType: e.target.value }))}
                  placeholder="Oily, Dry, Combination, Sensitive"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Concerns (comma-separated)</label>
                <textarea
                  value={editForm.concerns}
                  onChange={(e) => setEditForm(prev => ({ ...prev, concerns: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  rows={2}
                  placeholder="Aging, Acne, Sensitivity, Dark Spots"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Allergies (comma-separated)</label>
                <textarea
                  value={editForm.allergies}
                  onChange={(e) => setEditForm(prev => ({ ...prev, allergies: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  rows={2}
                  placeholder="Retinol, Salicylic Acid, Fragrance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  rows={3}
                  placeholder="Additional notes about the client..."
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveClient}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
