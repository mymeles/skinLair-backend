#!/bin/bash

# Simple Booking Flow Test Script
# Tests the backend API endpoints

BACKEND_URL="http://localhost:9000"
PUBLISHABLE_KEY="pk_test_01JGQXQXQXQXQXQXQXQXQX"

echo "=========================================="
echo "BOOKING FLOW TEST"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
HEALTH=$(curl -s -w "\n%{http_code}" $BACKEND_URL/health)
HTTP_CODE=$(echo "$HEALTH" | tail -n1)
RESPONSE=$(echo "$HEALTH" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Backend is healthy"
    echo "Response: $RESPONSE"
else
    echo "✗ Backend health check failed (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 2: Get Services
echo "Test 2: Get Services"
echo "--------------------"
SERVICES=$(curl -s -w "\n%{http_code}" \
    -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
    $BACKEND_URL/store/services)
HTTP_CODE=$(echo "$SERVICES" | tail -n1)
RESPONSE=$(echo "$SERVICES" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Services retrieved successfully"
    echo "Response: $RESPONSE" | head -c 500
    echo "..."
else
    echo "✗ Failed to get services (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 3: Get Availability
echo "Test 3: Get Availability"
echo "------------------------"
# Get tomorrow's date
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
SERVICE_ID="service_01JGQXQXQXQXQXQXQXQXQX"  # Replace with actual service ID

AVAILABILITY=$(curl -s -w "\n%{http_code}" \
    -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
    "$BACKEND_URL/store/availability?service_id=$SERVICE_ID&date=$TOMORROW")
HTTP_CODE=$(echo "$AVAILABILITY" | tail -n1)
RESPONSE=$(echo "$AVAILABILITY" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Availability retrieved successfully"
    echo "Date: $TOMORROW"
    echo "Response: $RESPONSE" | head -c 500
    echo "..."
else
    echo "✗ Failed to get availability (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 4: Create Booking
echo "Test 4: Create Booking"
echo "----------------------"
BOOKING_DATA='{
  "customer_name": "Test Customer",
  "customer_email": "test@example.com",
  "customer_phone": "+1234567890",
  "service_id": "'$SERVICE_ID'",
  "scheduled_date": "'$TOMORROW'",
  "scheduled_time": "10:00",
  "notes": "Test booking from script"
}'

BOOKING=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
    -d "$BOOKING_DATA" \
    $BACKEND_URL/store/bookings)
HTTP_CODE=$(echo "$BOOKING" | tail -n1)
RESPONSE=$(echo "$BOOKING" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Booking created successfully"
    echo "Response: $RESPONSE"
    BOOKING_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Booking ID: $BOOKING_ID"
else
    echo "✗ Failed to create booking (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 5: Create Payment Intent
if [ -n "$BOOKING_ID" ]; then
    echo "Test 5: Create Payment Intent"
    echo "------------------------------"
    PAYMENT_DATA='{
      "booking_id": "'$BOOKING_ID'",
      "payment_type": "deposit"
    }'

    PAYMENT=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d "$PAYMENT_DATA" \
        $BACKEND_URL/store/payments/create-intent)
    HTTP_CODE=$(echo "$PAYMENT" | tail -n1)
    RESPONSE=$(echo "$PAYMENT" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Payment intent created successfully"
        echo "Response: $RESPONSE"
    else
        echo "✗ Failed to create payment intent (HTTP $HTTP_CODE)"
        echo "Response: $RESPONSE"
    fi
    echo ""
fi

echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="

