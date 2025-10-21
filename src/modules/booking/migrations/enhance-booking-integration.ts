import { ExecArgs } from "@medusajs/framework/types"

export default async function enhanceBookingIntegration({ container }: ExecArgs) {
  const manager = container.resolve("manager") as any

  try {
    // Add new fields to booking table
    await manager.getConnection().execute(
      `ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "order_id" TEXT NULL;`
    )
    await manager.getConnection().execute(
      `ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "cart_id" TEXT NULL;`
    )
    await manager.getConnection().execute(
      `ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "qr_code" TEXT NULL;`
    )
    await manager.getConnection().execute(
      `ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "checked_in" BOOLEAN DEFAULT FALSE;`
    )
    await manager.getConnection().execute(
      `ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "checked_in_at" TIMESTAMP WITH TIME ZONE NULL;`
    )

    // Add new fields to service table
    await manager.getConnection().execute(
      `ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "product_id" TEXT NULL;`
    )
    await manager.getConnection().execute(
      `ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "variant_id" TEXT NULL;`
    )

    console.log("Booking integration enhanced with Medusa core models.")
  } catch (error) {
    console.error("Error enhancing booking integration:", error)
    throw error
  }
}

export const config = {
  transaction: "auto",
}
