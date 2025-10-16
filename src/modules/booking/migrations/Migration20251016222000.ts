import { Migration } from '@mikro-orm/migrations';

export class Migration20251016222000 extends Migration {

  override async up(): Promise<void> {
    // Drop the stripe_payment_intent_id column since we're using id as the Stripe Payment Intent ID
    this.addSql(`ALTER TABLE "booking_payment" DROP COLUMN IF EXISTS "stripe_payment_intent_id";`);
  }

  override async down(): Promise<void> {
    // Add back the stripe_payment_intent_id column
    this.addSql(`ALTER TABLE "booking_payment" ADD COLUMN "stripe_payment_intent_id" text null;`);
  }

}

