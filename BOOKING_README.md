# Booking System for SkinLair

A comprehensive booking system integrated with Medusa v2 for managing service appointments.

## Features

- **Service Management**: Create and manage services with pricing, duration, and categories
- **Availability Management**: Set staff availability schedules
- **Time Slot Generation**: Automatic generation of available time slots
- **Conflict Detection**: Prevents double-booking
- **Customer Bookings**: Customers can view and manage their appointments
- **Admin Dashboard**: Manage all bookings, services, and availability

## Backend Setup (Medusa)

### 1. Database Migration

The booking module will automatically create the necessary database tables. Run migrations:

```bash
cd skinLair
npm run build
npx medusa db:migrate
```

### 2. Seed Initial Data

To populate initial services and availability, run:

```bash
npm run seed
```

Or create services and availability manually via the API.

## API Endpoints

### Store API (Customer-facing)

#### Services
- `GET /store/services` - List all active services
- `GET /store/services/:id` - Get a specific service
- `POST /store/services` - Create a service (admin)

#### Bookings
- `GET /store/bookings` - List bookings (filter by customer_email)
- `POST /store/bookings` - Create a new booking
- `GET /store/bookings/:id` - Get a specific booking
- `POST /store/bookings/:id` - Update a booking
- `DELETE /store/bookings/:id` - Cancel a booking

#### Availability
- `GET /store/availability` - Get available time slots
  - Query params: `service_id`, `date`, `staff_id` (optional)

### Admin API

#### Bookings Management
- `GET /admin/bookings` - List all bookings with stats

#### Availability Management
- `GET /admin/availability` - List all availability rules
- `POST /admin/availability` - Create availability rule

## Frontend Setup (Next.js Storefront)

### 1. Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

### 2. Access the Booking Page

Navigate to: `http://localhost:8000/us/bookings`

## Data Models

### Service
```typescript
{
  id: string
  name: string
  description?: string
  duration: number // minutes
  price: number // cents
  category?: string
  image_url?: string
  is_active: boolean
  deposit_required: boolean
  deposit_amount?: number
  buffer_time: number
  max_advance_booking: number // days
}
```

### Booking
```typescript
{
  id: string
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  service_id: string
  service_name: string
  service_duration: number
  service_price: number
  scheduled_date: Date
  scheduled_time: string // "HH:MM"
  end_time: string // "HH:MM"
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
  notes?: string
  staff_id?: string
  staff_name?: string
  deposit_paid: boolean
  deposit_amount?: number
}
```

### Availability
```typescript
{
  id: string
  staff_id?: string
  staff_name?: string
  day_of_week: number // 0-6 (Sunday-Saturday)
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
  is_available: boolean
}
```

## Example API Calls

### Create a Service
```bash
curl -X POST http://localhost:9000/store/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic Facial",
    "description": "Deep cleansing facial treatment",
    "duration": 60,
    "price": 8500,
    "category": "Facials",
    "deposit_required": true,
    "deposit_amount": 2500
  }'
```

### Create Availability
```bash
curl -X POST http://localhost:9000/admin/availability \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "17:00",
    "is_available": true
  }'
```

### Get Available Slots
```bash
curl "http://localhost:9000/store/availability?service_id=SERVICE_ID&date=2024-10-20"
```

### Create a Booking
```bash
curl -X POST http://localhost:9000/store/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "customer_phone": "+1234567890",
    "service_id": "SERVICE_ID",
    "scheduled_date": "2024-10-20",
    "scheduled_time": "10:00",
    "notes": "First time customer"
  }'
```

## Extending the System

### Add Email Notifications
Install a notification service like SendGrid or Resend and create a subscriber:

```typescript
// src/subscribers/booking-confirmation.ts
import { SubscriberArgs } from "@medusajs/framework"

export default async function bookingConfirmationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ booking: any }>) {
  // Send email notification
  console.log("Booking created:", data.booking)
  // Implement email sending logic
}
```

### Add Payment Integration
Use Stripe or similar to handle deposits:
- Add payment intent creation to booking flow
- Store payment information in booking
- Handle refunds for cancellations

### Add Calendar Integration
Export bookings to Google Calendar or Outlook:
- Use respective calendar APIs
- Generate ICS files for downloads

### Add SMS Reminders
Integrate Twilio or similar for SMS notifications:
- Send booking confirmations
- Send reminders 24 hours before appointment
- Send follow-up messages

## Recommended Libraries

- **Calendar UI**: `react-calendar` or `@headlessui/react` with Tailwind
- **Form Validation**: `zod` or `yup`
- **Date Handling**: `date-fns` or `dayjs`
- **Email**: `@sendgrid/mail` or `resend`
- **SMS**: `twilio`
- **Payment**: `@stripe/stripe-js`

## Development

Start both servers:

```bash
# Terminal 1 - Backend
cd skinLair
npm run dev

# Terminal 2 - Frontend
cd skinLair-storefront
npm run dev
```

Access:
- Storefront: http://localhost:8000
- Admin: http://localhost:9000/app
- API: http://localhost:9000

## Testing

Test the booking flow:
1. Create services via API or admin
2. Set up availability for the week
3. Visit booking page and select a service
4. Choose date and time
5. Fill in customer information
6. Confirm booking
7. Check booking appears in admin

## Troubleshooting

**No time slots showing:**
- Ensure availability is set for the selected day
- Check service duration fits within availability window
- Verify no conflicts with existing bookings

**TypeScript errors:**
- Run `npm run build` to regenerate types
- Check module registration in `medusa-config.ts`

**Database errors:**
- Run migrations: `npx medusa db:migrate`
- Check database connection in `.env`
