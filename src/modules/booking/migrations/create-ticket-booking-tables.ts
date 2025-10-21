import { ExecArgs } from "@medusajs/framework/types"

async function createTicketBookingTables({ container }: ExecArgs) {
  const manager = container.resolve("manager") as any

  try {
    // Create venue table
    await manager.getConnection().execute(`
      CREATE TABLE IF NOT EXISTS "venue" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "address" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "is_active" BOOLEAN DEFAULT TRUE,
        "provider_name" TEXT,
        "provider_phone" TEXT,
        "provider_email" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create ticket_product table
    await manager.getConnection().execute(`
      CREATE TABLE IF NOT EXISTS "ticket_product" (
        "id" TEXT PRIMARY KEY,
        "product_id" TEXT UNIQUE NOT NULL,
        "service_id" TEXT NOT NULL,
        "venue_id" TEXT NOT NULL,
        "dates" JSONB,
        "time_slots" JSONB,
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create ticket_product_variant table
    await manager.getConnection().execute(`
      CREATE TABLE IF NOT EXISTS "ticket_product_variant" (
        "id" TEXT PRIMARY KEY,
        "variant_id" TEXT UNIQUE NOT NULL,
        "ticket_product_id" TEXT NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "time_slot" TEXT NOT NULL,
        "price" INTEGER NOT NULL,
        "max_quantity" INTEGER DEFAULT 1,
        "available_quantity" INTEGER DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create ticket_purchase table
    await manager.getConnection().execute(`
      CREATE TABLE IF NOT EXISTS "ticket_purchase" (
        "id" TEXT PRIMARY KEY,
        "ticket_product_id" TEXT NOT NULL,
        "ticket_product_variant_id" TEXT NOT NULL,
        "order_id" TEXT,
        "customer_id" TEXT,
        "customer_name" TEXT NOT NULL,
        "customer_email" TEXT NOT NULL,
        "customer_phone" TEXT,
        "service_name" TEXT NOT NULL,
        "service_duration" INTEGER NOT NULL,
        "scheduled_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "scheduled_time" TEXT NOT NULL,
        "end_time" TEXT NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "qr_code" TEXT,
        "checked_in" BOOLEAN DEFAULT FALSE,
        "checked_in_at" TIMESTAMP WITH TIME ZONE,
        "notes" TEXT,
        "staff_id" TEXT,
        "staff_name" TEXT,
        "payment_paid" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create indexes
    await manager.getConnection().execute(`
      CREATE INDEX IF NOT EXISTS "idx_venue_active" ON "venue" ("is_active");
    `)
    
    await manager.getConnection().execute(`
      CREATE INDEX IF NOT EXISTS "idx_ticket_product_venue_dates" ON "ticket_product" ("venue_id", "dates");
    `)
    
    await manager.getConnection().execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_ticket_product_variant_unique" ON "ticket_product_variant" ("ticket_product_id", "date", "time_slot");
    `)
    
    await manager.getConnection().execute(`
      CREATE INDEX IF NOT EXISTS "idx_ticket_purchase_order" ON "ticket_purchase" ("order_id");
    `)
    
    await manager.getConnection().execute(`
      CREATE INDEX IF NOT EXISTS "idx_ticket_purchase_customer" ON "ticket_purchase" ("customer_email");
    `)
    
    await manager.getConnection().execute(`
      CREATE INDEX IF NOT EXISTS "idx_ticket_purchase_date_status" ON "ticket_purchase" ("scheduled_date", "status");
    `)

    console.log("Ticket booking tables created successfully!")
  } catch (error) {
    console.error("Error creating ticket booking tables:", error)
    throw error
  }
}

export default createTicketBookingTables
