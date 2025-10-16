import { Migration } from '@mikro-orm/migrations';

export class Migration20251016224410 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "availability" ("id" text not null, "staff_id" text null, "staff_name" text null, "day_of_week" integer not null, "start_time" text not null, "end_time" text not null, "is_available" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "availability_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_availability_deleted_at" ON "availability" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "booking" ("id" text not null, "customer_id" text null, "customer_name" text not null, "customer_email" text not null, "customer_phone" text null, "service_id" text not null, "service_name" text not null, "service_duration" integer not null, "service_price" integer not null, "scheduled_date" timestamptz not null, "scheduled_time" text not null, "end_time" text not null, "status" text check ("status" in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')) not null default 'pending', "notes" text null, "staff_id" text null, "staff_name" text null, "deposit_paid" boolean not null default false, "deposit_amount" integer null, "reminder_sent" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "booking_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_deleted_at" ON "booking" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "booking_payment" ("id" text not null, "booking_id" text not null, "stripe_charge_id" text null, "amount" integer not null, "currency" text not null default 'usd', "status" text check ("status" in ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')) not null default 'pending', "payment_type" text check ("payment_type" in ('full', 'deposit')) not null default 'deposit', "customer_email" text not null, "metadata" jsonb null, "refund_amount" integer null, "refund_reason" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "booking_payment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_payment_deleted_at" ON "booking_payment" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "service" ("id" text not null, "name" text not null, "description" text null, "duration" integer not null, "price" integer not null, "category" text null, "image_url" text null, "is_active" boolean not null default true, "deposit_required" boolean not null default false, "deposit_amount" integer null, "buffer_time" integer not null default 0, "max_advance_booking" integer not null default 90, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_deleted_at" ON "service" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "availability" cascade;`);

    this.addSql(`drop table if exists "booking" cascade;`);

    this.addSql(`drop table if exists "booking_payment" cascade;`);

    this.addSql(`drop table if exists "service" cascade;`);
  }

}
