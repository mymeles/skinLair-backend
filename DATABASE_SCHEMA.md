# Database Schema Documentation

This document provides complete SQL schema definitions for all booking-related tables.

## Overview

The booking system uses 4 main tables:
- `service` - Available services for booking
- `booking` - Customer booking records
- `booking_payment` - Payment records linked to bookings
- `availability` - Staff availability schedules

## Schema Definitions

### Service Table

```sql
CREATE TABLE IF NOT EXISTS "service" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "description" text NULL,
  "duration" integer NOT NULL,
  "price" integer NOT NULL,
  "category" text NULL,
  "image_url" text NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "deposit_required" boolean NOT NULL DEFAULT false,
  "deposit_amount" integer NULL,
  "buffer_time" integer NOT NULL DEFAULT 0,
  "max_advance_booking" integer NOT NULL DEFAULT 90,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_service_deleted_at" 
  ON "service" (deleted_at) 
  WHERE deleted_at IS NULL;
```

### Booking Table

```sql
CREATE TABLE IF NOT EXISTS "booking" (
  "id" text NOT NULL,
  "customer_id" text NULL,
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "customer_phone" text NULL,
  "service_id" text NOT NULL,
  "service_name" text NOT NULL,
  "service_duration" integer NOT NULL,
  "service_price" integer NOT NULL,
  "scheduled_date" timestamptz NOT NULL,
  "scheduled_time" text NOT NULL,
  "end_time" text NOT NULL,
  "status" text CHECK ("status" IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')) NOT NULL DEFAULT 'pending',
  "notes" text NULL,
  "staff_id" text NULL,
  "staff_name" text NULL,
  "deposit_paid" boolean NOT NULL DEFAULT false,
  "deposit_amount" integer NULL,
  "reminder_sent" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_booking_deleted_at" 
  ON "booking" (deleted_at) 
  WHERE deleted_at IS NULL;
```

### Booking Payment Table

```sql
CREATE TABLE IF NOT EXISTS "booking_payment" (
  "id" text NOT NULL,  -- Stripe Payment Intent ID
  "booking_id" text NOT NULL,
  "stripe_charge_id" text NULL,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'usd',
  "status" text CHECK ("status" IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')) NOT NULL DEFAULT 'pending',
  "payment_type" text CHECK ("payment_type" IN ('full', 'deposit')) NOT NULL DEFAULT 'deposit',
  "customer_email" text NOT NULL,
  "metadata" jsonb NULL,
  "refund_amount" integer NULL,
  "refund_reason" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "booking_payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_booking_payment_deleted_at" 
  ON "booking_payment" (deleted_at) 
  WHERE deleted_at IS NULL;
```

**Note:** The `id` field uses the Stripe Payment Intent ID directly as the primary key.

### Availability Table

```sql
CREATE TABLE IF NOT EXISTS "availability" (
  "id" text NOT NULL,
  "staff_id" text NULL,
  "staff_name" text NULL,
  "day_of_week" integer NOT NULL,  -- 0-6 (Sunday-Saturday)
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "is_available" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_availability_deleted_at" 
  ON "availability" (deleted_at) 
  WHERE deleted_at IS NULL;
```

## Recreating the Schema

To drop and recreate all tables:

```sql
-- Drop tables in correct order (reverse of creation)
DROP TABLE IF EXISTS "availability" CASCADE;
DROP TABLE IF EXISTS "booking_payment" CASCADE;
DROP TABLE IF EXISTS "booking" CASCADE;
DROP TABLE IF EXISTS "service" CASCADE;

-- Then run all CREATE TABLE statements above
```

## Field Descriptions

### Service Fields
- `duration`: Service duration in minutes
- `price`: Price in cents (e.g., 5000 = $50.00)
- `deposit_amount`: Deposit amount in cents (if required)
- `buffer_time`: Time buffer between appointments in minutes
- `max_advance_booking`: Maximum days in advance customers can book

### Booking Fields
- `service_price`: Snapshot of service price at booking time (cents)
- `service_duration`: Snapshot of service duration at booking time (minutes)
- `deposit_amount`: Required deposit amount (cents)
- `deposit_paid`: Whether deposit has been paid

### Payment Fields
- `id`: **Uses Stripe Payment Intent ID as primary key**
- `amount`: Payment amount in cents
- `payment_type`: Either 'deposit' or 'full' payment
- `metadata`: Additional data stored as JSON
