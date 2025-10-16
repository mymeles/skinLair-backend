# Payment & Email Notification System - Setup Guide

## Prerequisites

You'll need accounts for:
1. **Stripe** - For payment processing
2. **Resend** - For email notifications (or use your own SMTP)

## Environment Variables

### Backend (.env in `/skinLair`)

```bash
# Existing variables
DATABASE_URL=postgresql://username:password@localhost:5432/skinlair
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret

# New Payment & Notification variables
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=SkinLair <noreply@yourdomain.com>
STORE_URL=http://localhost:8000
```

### Frontend (.env.local in `/skinLair-storefront`)

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Setup Instructions

### 1. Stripe Setup

1. **Create Stripe Account**: Go to https://stripe.com and create an account

2. **Get API Keys**:
   - Go to Developers → API keys
   - Copy "Publishable key" → Add to frontend `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy "Secret key" → Add to backend `.env` as `STRIPE_SECRET_KEY`

3. **Setup Webhook** (for production):
   ```bash
   # Install Stripe CLI for local testing
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   
   # Forward webhooks to local backend
   stripe listen --forward-to localhost:9000/store/webhooks/stripe
   
   # Copy the webhook signing secret to .env as STRIPE_WEBHOOK_SECRET
   ```

4. **Test Cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Exp: Any future date, CVC: Any 3 digits

### 2. Resend Setup

1. **Create Resend Account**: Go to https://resend.com and create an account

2. **Get API Key**:
   - Go to API Keys
   - Create new API key
   - Copy and add to backend `.env` as `RESEND_API_KEY`

3. **Verify Domain** (optional but recommended):
   - Go to Domains
   - Add your domain
   - Follow DNS verification steps
   - Update `EMAIL_FROM` in `.env` to use your verified domain

4. **Alternative Email Service** (if not using Resend):
   You can modify `/skinLair/src/modules/notification/email-service.ts` to use:
   - Nodemailer with SMTP
   - SendGrid
   - AWS SES
   - Any other email service

### 3. Database Migration

```bash
cd skinLair
npm run build
npx medusa db:migrate
```

This will create the new `booking_payment` table.

### 4. Start Both Servers

Terminal 1 - Backend:
```bash
cd skinLair
npm run dev
```

Terminal 2 - Frontend:
```bash
cd skinLair-storefront
npm run dev
```

Terminal 3 - Stripe Webhook (for local testing):
```bash
stripe listen --forward-to localhost:9000/store/webhooks/stripe
```

## Testing the System

### Test Booking with Payment

1. Visit: `http://localhost:8000/us/bookings`
2. Select a service with deposit required
3. Choose date and time
4. Fill in customer information
5. Click "Continue to Payment"
6. Use test card: `4242 4242 4242 4242`
7. Complete payment

### Test Email Notifications

Emails are sent automatically for:
- ✅ Booking confirmation (when booking is created)
- ✅ Payment confirmation (when payment succeeds)
- ✅ Booking cancellation (when booking is cancelled)
- ✅ Booking reminder (24 hours before - implement via cron job)

Check your Resend dashboard to see sent emails.

### Test Admin Dashboard

Access payment management:
```bash
# Get all payments
curl http://localhost:9000/admin/payments

# Get payments for specific booking
curl "http://localhost:9000/admin/payments?booking_id=BOOKING_ID"

# Issue refund
curl -X POST http://localhost:9000/admin/payments/refund \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "PAYMENT_ID",
    "reason": "Customer requested"
  }'
```

## API Endpoints

### Store API (Customer)

**Create Payment Intent**:
```bash
POST /store/payments/create-intent
Body: {
  "booking_id": "booking_123",
  "payment_type": "deposit" | "full"
}
```

**Confirm Payment**:
```bash
POST /store/payments/confirm
Body: {
  "payment_intent_id": "pi_xxx"
}
```

### Admin API

**List All Payments**:
```bash
GET /admin/payments
Query: ?status=succeeded&customer_email=user@email.com
```

**Refund Payment**:
```bash
POST /admin/payments/refund
Body: {
  "payment_id": "payment_123",
  "amount": 5000,  // optional, full refund if omitted
  "reason": "requested_by_customer"
}
```

### Webhook

**Stripe Webhook**:
```bash
POST /store/webhooks/stripe
```

This endpoint receives events from Stripe:
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund issued

## Email Templates

Email templates are in `/skinLair/src/modules/notification/email-service.ts`:

- `sendBookingConfirmation()` - Sent when booking is created
- `sendPaymentConfirmation()` - Sent when payment succeeds
- `sendBookingCancellation()` - Sent when booking is cancelled
- `sendBookingReminder()` - Sent 24 hours before appointment

Customize these templates to match your brand.

## Payment Flow

1. **Customer books appointment** → Booking created with status "pending"
2. **If deposit required** → Payment modal appears
3. **Customer enters card** → Stripe PaymentIntent created
4. **Payment processed** → Stripe confirms payment
5. **Webhook received** → Backend updates booking status to "confirmed"
6. **Email sent** → Customer receives confirmation

## Admin Management

### Via API

```javascript
// Get booking payments
const payments = await fetch('/admin/payments?booking_id=123')

// Refund a payment
await fetch('/admin/payments/refund', {
  method: 'POST',
  body: JSON.stringify({
    payment_id: 'payment_123',
    reason: 'Customer requested'
  })
})
```

### Booking Statuses

- `pending` - Booked but no payment
- `confirmed` - Payment received
- `cancelled` - Cancelled by customer/admin
- `completed` - Service delivered
- `no_show` - Customer didn't show up

### Payment Statuses

- `pending` - Payment intent created
- `processing` - Payment being processed
- `succeeded` - Payment completed
- `failed` - Payment declined
- `cancelled` - Payment cancelled
- `refunded` - Payment refunded

## Production Deployment

### 1. Update Environment Variables

Set production values for:
- `STRIPE_SECRET_KEY` → Production key
- `STRIPE_WEBHOOK_SECRET` → Production webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Production publishable key
- `RESEND_API_KEY` → Production API key
- `EMAIL_FROM` → Your verified domain email
- `STORE_URL` → Your production URL

### 2. Setup Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/store/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Verify Domain for Emails

1. Add your domain in Resend
2. Add DNS records (SPF, DKIM, DMARC)
3. Verify domain
4. Update `EMAIL_FROM` to use your domain

## Troubleshooting

**Payment not working:**
- Check Stripe API keys are correct
- Verify webhook is receiving events
- Check browser console for errors

**Emails not sending:**
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Verify `EMAIL_FROM` address

**Webhook errors:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint is accessible
- Review backend logs for errors

## Security Notes

⚠️ **Never expose secret keys in frontend code**
⚠️ **Always validate webhook signatures**
⚠️ **Use HTTPS in production**
⚠️ **Implement rate limiting on payment endpoints**
⚠️ **Log all payment transactions**

## Support

For issues:
- Stripe: https://stripe.com/docs
- Resend: https://resend.com/docs
- Medusa: https://docs.medusajs.com
