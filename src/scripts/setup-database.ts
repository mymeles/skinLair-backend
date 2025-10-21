import { ExecArgs } from "@medusajs/framework/types"

export default async function setupDatabase({ container }: ExecArgs) {
  console.log("Setting up database...")

  try {
    const manager = container.resolve("manager") as any
    const connection = manager.getConnection()

    // Create basic Medusa tables that we need
    console.log("Creating basic Medusa tables...")
    
    // Create store table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS "store" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "default_currency_code" TEXT NOT NULL,
        "default_sales_channel_id" TEXT,
        "default_location_id" TEXT,
        "metadata" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create region table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS "region" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "currency_code" TEXT NOT NULL,
        "tax_rate" DECIMAL(10,2) DEFAULT 0,
        "tax_code" TEXT,
        "gift_cards_taxable" BOOLEAN DEFAULT TRUE,
        "automatic_taxes" BOOLEAN DEFAULT FALSE,
        "countries" JSONB,
        "tax_providers" JSONB,
        "payment_providers" JSONB,
        "fulfillment_providers" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create currency table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS "currency" (
        "code" TEXT PRIMARY KEY,
        "symbol" TEXT NOT NULL,
        "symbol_native" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "includes_tax" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create api_key table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS "api_key" (
        "id" TEXT PRIMARY KEY,
        "token" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "created_by" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create publishable_api_key table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS "publishable_api_key" (
        "id" TEXT PRIMARY KEY,
        "token" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "created_by" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create our booking tables
    console.log("Creating booking tables...")
    
    // Create service table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS "service" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "duration" INTEGER NOT NULL,
        "price" INTEGER NOT NULL,
        "category" TEXT,
        "image_url" TEXT,
        "is_active" BOOLEAN DEFAULT TRUE,
        "buffer_time" INTEGER DEFAULT 0,
        "max_advance_booking" INTEGER DEFAULT 90,
        "product_id" TEXT,
        "variant_id" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Create booking table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS "booking" (
        "id" TEXT PRIMARY KEY,
        "customer_id" TEXT,
        "customer_name" TEXT NOT NULL,
        "customer_email" TEXT NOT NULL,
        "customer_phone" TEXT,
        "service_id" TEXT NOT NULL,
        "service_name" TEXT NOT NULL,
        "service_duration" INTEGER NOT NULL,
        "service_price" INTEGER NOT NULL,
        "scheduled_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "scheduled_time" TEXT NOT NULL,
        "end_time" TEXT NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "notes" TEXT,
        "staff_id" TEXT,
        "staff_name" TEXT,
        "payment_paid" BOOLEAN DEFAULT FALSE,
        "reminder_sent" BOOLEAN DEFAULT FALSE,
        "order_id" TEXT,
        "cart_id" TEXT,
        "qr_code" TEXT,
        "checked_in" BOOLEAN DEFAULT FALSE,
        "checked_in_at" TIMESTAMP WITH TIME ZONE,
        "refund_amount" INTEGER,
        "refund_reason" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE NULL
      );
    `)

    // Insert basic data
    console.log("Inserting basic data...")
    
    // Insert store
    await connection.execute(`
      INSERT INTO "store" (id, name, default_currency_code) 
      VALUES ('store_01', 'SkinLair Spa', 'usd') 
      ON CONFLICT (id) DO NOTHING;
    `)

    // Insert currency
    await connection.execute(`
      INSERT INTO "currency" (code, symbol, symbol_native, name) 
      VALUES ('usd', '$', '$', 'US Dollar') 
      ON CONFLICT (code) DO NOTHING;
    `)

    // Insert region
    await connection.execute(`
      INSERT INTO "region" (id, name, currency_code, tax_rate, countries) 
      VALUES ('reg_01', 'US', 'usd', 0.08, '["us"]') 
      ON CONFLICT (id) DO NOTHING;
    `)

    // Insert publishable API key
    await connection.execute(`
      INSERT INTO "publishable_api_key" (id, token, title) 
      VALUES ('pk_01', 'pk_test_123456789', 'Store API Key') 
      ON CONFLICT (id) DO NOTHING;
    `)

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Error setting up database:", error)
    throw error
  }
}
