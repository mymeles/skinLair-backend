"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Users, 
  Clock, 
  Star, 
  Calendar,
  Camera
} from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button, Input, Textarea, Select } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface VirtualSession {
  id: string
  clientName: string
  clientEmail: string
  serviceType: string
  scheduledTime: string
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  rating?: number
  notes?: string
  meetingLink?: string
}

interface EstheticianProfile {
  name: string
  specialty: string
  experience: string
  rating: number
  totalSessions: number
  totalInPersonSessions: number
  availability: string[]
  bio: string
  services: string[]
}

export const config = defineRouteConfig({
  label: "Virtual Esthetician",
  icon: Users,
})

export default function VirtualEsthetician() {
  const [sessions, setSessions] = useState<VirtualSession[]>([])
  const [profile, setProfile] = useState<EstheticianProfile>({
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
    ]
  })
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    specialty: "",
    experience: "",
    bio: "",
    availability: "",
    services: ""
  })

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      // Mock data - in real app, this would come from API
      setSessions([
        {
          id: "1",
          clientName: "Emma Wilson",
          clientEmail: "emma@example.com",
          serviceType: "Virtual Skin Analysis",
          scheduledTime: "2024-01-15T10:00:00Z",
          duration: 60,
          status: "scheduled",
          meetingLink: "https://meet.example.com/abc123"
        },
        {
          id: "2",
          clientName: "Jessica Chen",
          clientEmail: "jessica@example.com",
          serviceType: "In-Person: HydraFacial",
          scheduledTime: "2024-01-15T14:00:00Z",
          duration: 60,
          status: "in_progress",
          meetingLink: "https://meet.example.com/def456"
        },
        {
          id: "3",
          clientName: "Maria Rodriguez",
          clientEmail: "maria@example.com",
          serviceType: "Virtual Anti-Aging Consultation",
          scheduledTime: "2024-01-14T16:00:00Z",
          duration: 60,
          status: "completed",
          rating: 5,
          notes: "Excellent consultation, client very satisfied with treatment plan."
        },
        {
          id: "4",
          clientName: "Lisa Thompson",
          clientEmail: "lisa@example.com",
          serviceType: "In-Person: Chemical Peel",
          scheduledTime: "2024-01-16T11:00:00Z",
          duration: 45,
          status: "scheduled"
        },
        {
          id: "5",
          clientName: "Amanda Davis",
          clientEmail: "amanda@example.com",
          serviceType: "Virtual Treatment Planning",
          scheduledTime: "2024-01-16T15:30:00Z",
          duration: 30,
          status: "scheduled",
          meetingLink: "https://meet.example.com/ghi789"
        }
      ])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const startSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'in_progress' as const }
        : session
    ))
  }

  const endSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'completed' as const }
        : session
    ))
  }

  const handleEditProfile = () => {
    setEditForm({
      name: profile.name,
      specialty: profile.specialty,
      experience: profile.experience,
      bio: profile.bio,
      availability: profile.availability.join(", "),
      services: profile.services.join(", ")
    })
    setShowEditForm(true)
  }

  const handleSaveProfile = () => {
    setProfile(prev => ({
      ...prev,
      name: editForm.name,
      specialty: editForm.specialty,
      experience: editForm.experience,
      bio: editForm.bio,
      availability: editForm.availability.split(", ").filter(a => a.trim()),
      services: editForm.services.split(", ").filter(s => s.trim())
    }))
    setShowEditForm(false)
    alert("Esthetician profile updated successfully!")
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue'
      case 'in_progress': return 'green'
      case 'completed': return 'purple'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-ui-bg-subtle rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-ui-bg-subtle rounded"></div>
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
            Dr. Sarah Johnson - Complete Skincare Services
          </Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage virtual consultations and in-person spa treatments - your one-stop skincare expert
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowSettings(!showSettings)}
          >
            <div className="w-4 h-4 mr-2">⚙️</div>
            Settings
          </Button>
          <Badge color="green" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Online
          </Badge>
        </div>
      </div>

      {/* Profile div */}
      <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 text-white">📹</div>
            </div>
            <div>
              <Heading level="h2" className="text-xl font-semibold">
                {profile.name}
              </Heading>
              <Text className="text-ui-fg-subtle">{profile.specialty}</Text>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Text className="font-medium">{profile.rating}</Text>
                <Text className="text-sm text-ui-fg-subtle">
                  ({profile.totalSessions} sessions)
                </Text>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Text className="text-sm text-ui-fg-subtle">Experience</Text>
            <Text className="font-semibold">{profile.experience}</Text>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Text className="text-sm">{profile.bio}</Text>
              <div className="mt-2">
                <Text className="text-sm font-medium">Availability:</Text>
                <Text className="text-sm text-ui-fg-subtle">{profile.availability.join(", ")}</Text>
              </div>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={handleEditProfile}
              className="ml-4"
            >
              ✏️ Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Stats divs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Today's Appointments</Text>
              <Text className="text-2xl font-bold">
                {sessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length}
              </Text>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Virtual Sessions</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {sessions.filter(s => s.serviceType.includes('Virtual')).length}
              </Text>
            </div>
            <div className="w-8 h-8 text-blue-600">📹</div>
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">In-Person Services</Text>
              <Text className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.serviceType.includes('In-Person')).length}
              </Text>
            </div>
            <div className="w-8 h-8 text-green-600">🏥</div>
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Client Rating</Text>
              <div className="flex items-center gap-1">
                <Text className="text-2xl font-bold">{profile.rating}</Text>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Services Offered */}
      <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <Heading level="h3" className="text-lg font-semibold mb-4">
          Services Offered by Dr. Sarah Johnson
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="font-medium text-ui-fg-base mb-2">Virtual Services</Text>
            <div className="space-y-1">
              {profile.services.filter(service => 
                service.includes('Virtual') || 
                service.includes('Analysis') || 
                service.includes('Planning')
              ).map((service, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <Text className="text-sm">{service}</Text>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Text className="font-medium text-ui-fg-base mb-2">In-Person Services</Text>
            <div className="space-y-1">
              {profile.services.filter(service => 
                !service.includes('Virtual') && 
                !service.includes('Analysis') && 
                !service.includes('Planning')
              ).map((service, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <Text className="text-sm">{service}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <div className="flex items-center justify-between mb-4">
          <Heading level="h3" className="text-lg font-semibold">
            All Appointments (Virtual & In-Person)
          </Heading>
          <Button variant="primary">
            <div className="w-4 h-4 mr-2">📅</div>
            New Appointment
          </Button>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 border border-ui-border-base rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Text className="font-semibold">{session.clientName}</Text>
                    <Badge color={getStatusColor(session.status)}>
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Text className="text-sm text-ui-fg-subtle mb-1">
                    {session.serviceType}
                  </Text>
                  <Text className="text-sm text-ui-fg-subtle">
                    {formatTime(session.scheduledTime)} • {session.duration} minutes
                  </Text>
                  {session.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Text className="text-sm font-medium">{session.rating}/5</Text>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {session.status === 'scheduled' && (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => startSession(session.id)}
                    >
                      <div className="w-4 h-4 mr-1">▶️</div>
                      Start
                    </Button>
                  )}
                  
                  {session.status === 'in_progress' && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => endSession(session.id)}
                    >
                      <div className="w-4 h-4 mr-1">⏹️</div>
                      End
                    </Button>
                  )}
                  
                  {session.meetingLink && (
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => window.open(session.meetingLink, '_blank')}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  )}
                </div>
              </div>
              
              {session.notes && (
                <div className="mt-3 p-3 bg-ui-bg-subtle rounded">
                  <Text className="text-sm">
                    <strong>Notes:</strong> {session.notes}
                  </Text>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-md p-6 bg-ui-bg-base rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h3">Esthetician Settings</Heading>
              <Button
                variant="transparent"
                onClick={() => setShowSettings(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Text className="text-sm font-medium mb-2">Name</Text>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Text className="text-sm font-medium mb-2">Specialty</Text>
                <Input
                  value={profile.specialty}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialty: e.target.value }))}
                />
              </div>
              
              <div>
                <Text className="text-sm font-medium mb-2">Bio</Text>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowSettings(false)}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h3" className="text-lg font-semibold">
                Edit Esthetician Profile
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
                  placeholder="Dr. Sarah Johnson"
                />
                <Input
                  label="Specialty"
                  value={editForm.specialty}
                  onChange={(e) => setEditForm(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Advanced Skincare & Anti-Aging"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Experience"
                  value={editForm.experience}
                  onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="8+ years"
                />
                <Input
                  label="Availability"
                  value={editForm.availability}
                  onChange={(e) => setEditForm(prev => ({ ...prev, availability: e.target.value }))}
                  placeholder="9:00 AM - 5:00 PM, Monday - Friday"
                />
              </div>
              
              <div>
                <Text className="text-sm font-medium mb-2">Bio</Text>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  placeholder="Certified esthetician specializing in..."
                />
              </div>
              
              <div>
                <Text className="text-sm font-medium mb-2">Services (comma-separated)</Text>
                <Textarea
                  value={editForm.services}
                  onChange={(e) => setEditForm(prev => ({ ...prev, services: e.target.value }))}
                  rows={3}
                  placeholder="Virtual Skin Analysis, Treatment Planning, Classic Facial, Microneedling, Chemical Peel, HydraFacial, Laser Hair Removal, Anti-Aging Treatments"
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
                  onClick={handleSaveProfile}
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
