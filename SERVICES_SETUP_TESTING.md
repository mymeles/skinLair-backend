# Services Management - Setup & Testing Guide

## Quick Setup

### 1. Seed Initial Services

Run the seed script to populate the 4 initial services:

```bash
cd skinLair
npm run seed -- --script seed-services
```

Expected output:
```
Seeding services data...
Created service: Virtual Skin Consultation
Created service: Custom At-Home Skincare Plan
Created service: Hormonal & PCOS Skincare Plan
Created service: Follow-Up Sessions
Finished seeding services data.
```

### 2. Start Backend Server

```bash
cd skinLair
npm run dev
```

Backend should be running on `http://localhost:9000`

### 3. Start Frontend Server

In a new terminal:
```bash
cd skinLair-storefront
npm run dev
```

Frontend should be running on `http://localhost:8000`

## Testing the System

### Test 1: View Services on Storefront

1. Navigate to `http://localhost:8000/dk/services`
2. You should see 4 service cards:
   - Virtual Skin Consultation
   - Custom At-Home Skincare Plan
   - Hormonal & PCOS Skincare Plan
   - Follow-Up Sessions
3. Each card should display:
   - Service name
   - Duration
   - Price
   - Description
   - Deposit info (if applicable)
   - "Book Now" button

**Expected Result**: ✅ All 4 services display correctly

### Test 2: Book Now Flow

1. On services page, click "Book Now" on any service
2. You should be redirected to `http://localhost:8000/dk/bookings?service=SERVICE_ID`
3. The booking page should load with the service pre-selected
4. Service name should appear in the booking flow

**Expected Result**: ✅ Service is pre-selected in booking flow

### Test 3: Admin Services Management

1. Navigate to admin dashboard (typically `http://localhost:9000/admin`)
2. Look for "Services" in the sidebar menu
3. Click "Services"
4. You should see a table with all 4 services

**Expected Result**: ✅ Services table displays all services

### Test 4: Add New Service

1. On admin services page, click "Add New Service"
2. Fill in the form:
   - Name: "Test Service"
   - Duration: 30
   - Price: 2999 (for $29.99)
   - Description: "Test service description"
   - Active: checked
3. Click "Create Service"
4. Service should appear in the table

**Expected Result**: ✅ New service created and appears in table

### Test 5: Edit Service

1. In admin services table, click "Edit" on any service
2. Modify the service details (e.g., change price)
3. Click "Update Service"
4. Service should update in the table

**Expected Result**: ✅ Service updated successfully

### Test 6: Delete Service

1. In admin services table, click "Delete" on a service
2. Confirm the deletion
3. Service should disappear from the table

**Expected Result**: ✅ Service deleted (soft-deleted)

### Test 7: Verify Deleted Service Not on Storefront

1. Navigate back to `http://localhost:8000/dk/services`
2. The deleted service should no longer appear
3. Only active services should be displayed

**Expected Result**: ✅ Deleted service not visible on storefront

### Test 8: Booking with Service Reference

1. Go to services page
2. Click "Book Now" on a service
3. Complete the booking flow (select date, enter details, etc.)
4. After booking confirmation, verify the booking includes the service reference

**Expected Result**: ✅ Booking stores correct service ID and details

## API Testing

### Test Services API Endpoints

#### Get All Services (Store)
```bash
curl http://localhost:9000/store/services
```

Expected response:
```json
{
  "services": [
    {
      "id": "...",
      "name": "Virtual Skin Consultation",
      "duration": 60,
      "price": 9999,
      "is_active": true,
      ...
    }
  ]
}
```

#### Get All Services (Admin)
```bash
curl http://localhost:9000/admin/services
```

Expected response: Same as store, but includes inactive services

#### Create Service
```bash
curl -X POST http://localhost:9000/admin/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Service",
    "duration": 45,
    "price": 5000,
    "description": "Test service"
  }'
```

#### Update Service
```bash
curl -X PUT http://localhost:9000/admin/services/SERVICE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "price": 6000
  }'
```

#### Delete Service
```bash
curl -X DELETE http://localhost:9000/admin/services/SERVICE_ID
```

## Troubleshooting

### Services not appearing on storefront

**Problem**: Services page shows "No services available"

**Solutions**:
1. Check that seed script ran successfully
2. Verify services have `is_active: true`
3. Check browser console for fetch errors
4. Verify backend is running on port 9000
5. Check NEXT_PUBLIC_MEDUSA_BACKEND_URL in storefront .env

### Admin services page not loading

**Problem**: Admin services page shows error or blank

**Solutions**:
1. Verify you're logged into admin
2. Check that `/admin/services` endpoint exists
3. Clear browser cache
4. Check browser console for errors
5. Verify backend is running

### Service not pre-selected in booking

**Problem**: Clicking "Book Now" doesn't pre-select service

**Solutions**:
1. Check URL has `?service=SERVICE_ID` parameter
2. Verify service ID is correct
3. Check browser console for fetch errors
4. Verify booking module is loading services

### Deposit amount not showing

**Problem**: Deposit info not displayed on service card

**Solutions**:
1. Verify `deposit_required` is set to `true`
2. Verify `deposit_amount` is set (in cents)
3. Check that service card component is rendering deposit section
4. Clear browser cache

## Performance Notes

- Services are cached on the storefront (Next.js caching)
- Admin services page fetches fresh data on each load
- Consider implementing pagination for large service lists
- Consider caching service list on frontend for better performance

## Next Steps

1. ✅ Seed initial services
2. ✅ Test storefront services page
3. ✅ Test booking flow with service selection
4. ✅ Test admin services management
5. ✅ Test API endpoints
6. Consider: Add service images
7. Consider: Implement service availability calendar
8. Consider: Add staff assignment to services

