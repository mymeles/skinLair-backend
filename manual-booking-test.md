# Manual Booking Flow Test Guide

This guide provides step-by-step instructions to manually test the complete booking flow with payment integration.

## Prerequisites

1. Backend running on `http://localhost:9000`
2. Frontend running on `http://localhost:8000`
3. Stripe test keys configured in `.env`
4. Test credit card: `4242 4242 4242 4242` (any future date, any CVC)

## Test Steps

### Step 1: Verify Backend is Running

```bash
curl http://localhost:9000/health
```

Expected response: `{"status":"ok"}` or similar

### Step 2: Create a Test Service (via Admin or API)

```bash
curl -X POST http://localhost:9000/admin/services \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY" \
  -d '{
    "name": "Test Skin Consultation",
    "description": "60-minute virtual consultation",
    "duration": 60,
    "price": 100,
    "category": "consultation",
    "deposit_required": true,
    "deposit_amount": 25,
    "buffer_time": 15,
    "max_advance_booking": 90,
    "is_active": true
  }'
```

Save the returned `service_id` for next steps.

### Step 3: Get Available Services

```bash
curl http://localhost:9000/store/services \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY"
```

Expected: List of services including the one created above

### Step 4: Check Availability

```bash
# Replace SERVICE_ID and DATE (format: YYYY-MM-DD)
curl "http://localhost:9000/store/availability?service_id=SERVICE_ID&date=2025-10-17" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY"
```

Expected: List of available time slots

### Step 5: Create a Booking

```bash
curl -X POST http://localhost:9000/store/bookings \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY" \
  -d '{
    "customer_name": "Test Customer",
    "customer_email": "test@example.com",
    "customer_phone": "+1234567890",
    "service_id": "SERVICE_ID",
    "scheduled_date": "2025-10-17",
    "scheduled_time": "10:00",
    "notes": "Test booking"
  }'
```

Expected response:
```json
{
  "booking": {
    "id": "booking_xxx",
    "status": "pending",
    "deposit_paid": false,
    ...
  }
}
```

Save the `booking_id` for next steps.

### Step 6: Create Payment Intent

```bash
curl -X POST http://localhost:9000/store/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY" \
  -d '{
    "booking_id": "BOOKING_ID",
    "payment_type": "deposit"
  }'
```

Expected response:
```json
{
  "payment": {
    "id": "payment_xxx",
    "stripe_payment_intent_id": "pi_xxx",
    "amount": 2500,
    "status": "pending"
  },
  "client_secret": "pi_xxx_secret_xxx"
}
```

Save the `stripe_payment_intent_id` for next steps.

### Step 7: Test Payment Confirmation (Simulated)

**Note:** In a real scenario, the payment would be completed through Stripe's frontend SDK. For testing, we can try to confirm directly:

```bash
curl -X POST http://localhost:9000/store/payments/confirm \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY" \
  -d '{
    "payment_intent_id": "PAYMENT_INTENT_ID"
  }'
```

**Expected:** This will likely fail with a 400 error because the payment hasn't actually been processed through Stripe. This is normal for testing.

### Step 8: Verify Booking Status

```bash
curl http://localhost:9000/store/bookings/BOOKING_ID \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY"
```

Expected: Booking details with current status

## Frontend Testing

### Step 1: Navigate to Services Page

1. Open browser to `http://localhost:8000/services`
2. Verify services are displayed
3. Click "Book Now" on a service

### Step 2: Select Date and Time

1. Calendar should appear
2. Select a future date
3. Available time slots should load
4. Select a time slot
5. Click "Continue"

### Step 3: Fill Booking Form

1. Enter customer details:
   - Name: Test Customer
   - Email: test@example.com
   - Phone: +1234567890
   - Notes: (optional)
2. Click "Continue to Payment"

### Step 4: Complete Payment

1. Payment modal should appear
2. Enter Stripe test card: `4242 4242 4242 4242`
3. Enter any future expiry date (e.g., 12/25)
4. Enter any 3-digit CVC (e.g., 123)
5. Click "Pay"

### Step 5: Verify Confirmation

1. Should see success message
2. Booking confirmation should be displayed
3. Check email for confirmation (if email service is configured)

## Expected Results

### Successful Flow:
1. ✅ Service created and visible
2. ✅ Availability slots returned
3. ✅ Booking created with status "pending"
4. ✅ Payment intent created with correct amount
5. ✅ Payment processed through Stripe
6. ✅ Booking status updated to "confirmed"
7. ✅ deposit_paid flag set to true
8. ✅ Confirmation email sent

### Database Verification

Check the database to verify records were created:

```sql
-- Check services
SELECT * FROM service WHERE name LIKE '%Test%';

-- Check bookings
SELECT id, customer_name, status, deposit_paid, scheduled_date, scheduled_time 
FROM booking 
ORDER BY created_at DESC 
LIMIT 5;

-- Check payments
SELECT id, booking_id, amount, status, payment_type, stripe_payment_intent_id 
FROM booking_payment 
ORDER BY created_at DESC 
LIMIT 5;
```

## Troubleshooting

### Issue: "Backend not running"
**Solution:** Start backend with `npm run dev` in skinLair directory

### Issue: "No available slots"
**Solution:** Check that you're querying a future date and that availability records exist

### Issue: "Payment intent creation failed"
**Solution:** 
- Verify STRIPE_SECRET_KEY is set in .env
- Check that booking exists
- Verify booking has correct service_id

### Issue: "Payment confirmation failed"
**Solution:** 
- This is expected when testing without actual Stripe payment
- Use Stripe test cards in frontend for real payment flow
- Check Stripe dashboard for payment status

### Issue: "Hydration error in frontend"
**Solution:** 
- This has been fixed by adding `suppressHydrationWarning={true}` to body tag
- Clear browser cache and reload

## Test Checklist

- [ ] Backend health check passes
- [ ] Services can be created
- [ ] Services can be retrieved
- [ ] Availability returns time slots
- [ ] Booking can be created
- [ ] Booking has correct initial status (pending)
- [ ] Payment intent can be created
- [ ] Payment intent has correct amount (deposit or full)
- [ ] Payment intent has client_secret
- [ ] Payment record created in database
- [ ] Frontend displays services correctly
- [ ] Frontend booking flow works
- [ ] Payment modal appears
- [ ] Stripe payment form loads
- [ ] Payment can be submitted
- [ ] Booking status updates after payment
- [ ] Confirmation is displayed

## Notes

- Use Stripe test mode keys for all testing
- Test cards: https://stripe.com/docs/testing
- Payment webhooks may need ngrok for local testing
- Email notifications require RESEND_API_KEY configuration

