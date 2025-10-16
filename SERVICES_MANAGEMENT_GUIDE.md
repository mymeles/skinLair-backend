# Dynamic Services Management System - Implementation Guide

## Overview

This guide explains the fully dynamic services and booking system that has been implemented. Services are now managed from the admin dashboard and displayed dynamically on the storefront.

## Architecture

### Backend (skinLair/)

#### 1. Service Model
**File**: `src/modules/booking/models/service.ts`

The Service model stores all service information:
- `id`: Unique identifier
- `name`: Service name
- `description`: Service description
- `duration`: Duration in minutes
- `price`: Price in cents (e.g., 9999 = $99.99)
- `category`: Service category (e.g., "consultation", "plan")
- `image_url`: Optional image URL
- `is_active`: Whether service is available
- `deposit_required`: Whether a deposit is required
- `deposit_amount`: Deposit amount in cents
- `buffer_time`: Buffer time between appointments (minutes)
- `max_advance_booking`: Maximum days in advance to book

#### 2. Admin API Endpoints

**GET /admin/services**
- Lists all services (including inactive)
- Query params: `category`, `is_active`
- Returns: `{ services: Service[] }`

**POST /admin/services**
- Creates a new service
- Body: Service data (name, duration, price required)
- Returns: `{ service: Service }`

**GET /admin/services/[id]**
- Retrieves a single service
- Returns: `{ service: Service }`

**PUT /admin/services/[id]**
- Updates a service
- Body: Partial service data
- Returns: `{ service: Service }`

**DELETE /admin/services/[id]**
- Soft deletes a service (sets is_active to false)
- Returns: `{ success: true }`

#### 3. Store API Endpoints

**GET /store/services**
- Lists only active services
- Query params: `category`
- Returns: `{ services: Service[] }`

### Frontend (skinLair-storefront/)

#### 1. Services Page
**File**: `src/app/[countryCode]/(main)/services/page.tsx`

- Fetches services from `/store/services` API
- Displays services in a responsive grid
- Each service card shows:
  - Service name
  - Duration
  - Price
  - Description
  - Deposit info (if required)
  - "Book Now" button with service ID in query param

#### 2. Booking Flow
**File**: `src/modules/booking/index.tsx`

- Accepts `?service=SERVICE_ID` query parameter
- Auto-selects service if ID is provided
- Falls back to service list if no ID provided
- Passes selected service through booking flow

#### 3. Service List Component
**File**: `src/modules/booking/components/service-list.tsx`

- Fetches services from backend
- Displays list for user selection
- Handles loading and error states

## Admin Dashboard

### Services Management Page
**File**: `src/admin/routes/services/page.tsx`

Features:
- View all services in a table
- Add new services with form
- Edit existing services
- Delete/disable services
- Real-time updates

Form fields:
- Service Name (required)
- Category
- Duration in minutes (required)
- Price in cents (required)
- Description
- Active status
- Deposit required toggle
- Deposit amount (if deposit required)
- Buffer time
- Max advance booking days

## Seeding Initial Services

### Seed Script
**File**: `src/scripts/seed-services.ts`

Populates 4 initial services:
1. Virtual Skin Consultation - $99.99
2. Custom At-Home Skincare Plan - $199.99 (with $50 deposit)
3. Hormonal & PCOS Skincare Plan - $249.99 (with $75 deposit)
4. Follow-Up Sessions - $49.99

### Running the Seed Script

```bash
cd skinLair
npm run seed -- --script seed-services
```

Or if using the Medusa CLI:
```bash
medusa exec src/scripts/seed-services.ts
```

## User Flow

### Customer Journey

1. **Browse Services**
   - Visit `/dk/services` (or any country code)
   - See all active services with details
   - Click "Book Now" on desired service

2. **Booking Page**
   - Redirected to `/dk/bookings?service=SERVICE_ID`
   - Service is pre-selected
   - User proceeds through booking flow:
     - Select date/time
     - Enter customer details
     - Process payment
     - Receive confirmation

### Admin Journey

1. **Access Services Management**
   - Go to admin dashboard
   - Click "Services" in sidebar
   - View all services in table

2. **Add New Service**
   - Click "Add New Service"
   - Fill in service details
   - Click "Create Service"

3. **Edit Service**
   - Click "Edit" on service row
   - Modify details
   - Click "Update Service"

4. **Delete Service**
   - Click "Delete" on service row
   - Confirm deletion
   - Service is soft-deleted (is_active = false)

## Integration Points

### Service Selection Flow

```
Services Page (/dk/services)
    ↓
Fetch from /store/services
    ↓
Display ServiceCard components
    ↓
Click "Book Now" → /dk/bookings?service=SERVICE_ID
    ↓
Booking Module
    ↓
Fetch service from backend
    ↓
Pre-select service in booking flow
    ↓
User completes booking with service reference
```

### Admin Management Flow

```
Admin Dashboard → Services Page
    ↓
Fetch from /admin/services
    ↓
Display services table
    ↓
User actions:
  - Add: POST /admin/services
  - Edit: PUT /admin/services/[id]
  - Delete: DELETE /admin/services/[id]
    ↓
Refresh table with updated data
```

## API Response Examples

### GET /store/services
```json
{
  "services": [
    {
      "id": "service_123",
      "name": "Virtual Skin Consultation",
      "description": "A one-on-one video session...",
      "duration": 60,
      "price": 9999,
      "category": "consultation",
      "is_active": true,
      "deposit_required": false,
      "deposit_amount": null,
      "buffer_time": 15,
      "max_advance_booking": 90
    }
  ]
}
```

### POST /admin/services
```json
{
  "name": "New Service",
  "description": "Service description",
  "duration": 45,
  "price": 5000,
  "category": "consultation",
  "is_active": true,
  "deposit_required": false,
  "buffer_time": 15,
  "max_advance_booking": 90
}
```

## Testing Checklist

- [ ] Services page loads and displays all active services
- [ ] "Book Now" button passes service ID to booking page
- [ ] Booking page pre-selects service from URL parameter
- [ ] Admin can view all services
- [ ] Admin can create new service
- [ ] Admin can edit existing service
- [ ] Admin can delete service
- [ ] Deleted services don't appear on storefront
- [ ] Booking creation stores correct service reference
- [ ] Service details display correctly in booking confirmation

## Troubleshooting

### Services not appearing on storefront
- Check that services have `is_active: true`
- Verify `/store/services` API is returning data
- Check browser console for fetch errors

### Admin page not loading
- Verify `/admin/services` API endpoint exists
- Check that admin user has proper permissions
- Clear browser cache and reload

### Service not pre-selected in booking
- Verify service ID in URL query parameter
- Check that service exists in database
- Verify booking module is fetching services correctly

## Future Enhancements

- Add service images/gallery
- Implement service availability calendar
- Add staff assignment to services
- Service pricing tiers
- Seasonal pricing
- Service bundles/packages
- Customer reviews/ratings

