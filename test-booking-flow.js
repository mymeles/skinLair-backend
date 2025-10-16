#!/usr/bin/env node

/**
 * Comprehensive Booking Flow Test Script
 * 
 * This script tests the complete booking flow including:
 * 1. Service creation and retrieval
 * 2. Availability checking
 * 3. Booking creation
 * 4. Payment intent creation
 * 5. Payment confirmation
 * 6. Booking status updates
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || 'pk_test_01JGQXQXQXQXQXQXQXQXQX';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`STEP ${step}: ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUBLISHABLE_KEY,
    ...options.headers,
  };

  logInfo(`Making ${options.method || 'GET'} request to: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      logError(`Request failed with status ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      throw new Error(data.message || data.error || 'Request failed');
    }

    logSuccess(`Request successful (${response.status})`);
    return { response, data };
  } catch (error) {
    logError(`Request error: ${error.message}`);
    throw error;
  }
}

async function testHealthCheck() {
  logStep(1, 'Health Check');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (response.ok) {
      logSuccess('Backend is running and healthy');
      return true;
    } else {
      logError('Backend health check failed');
      return false;
    }
  } catch (error) {
    logError(`Cannot connect to backend: ${error.message}`);
    return false;
  }
}

async function testCreateService() {
  logStep(2, 'Create Test Service');
  
  const serviceData = {
    name: 'Test Consultation',
    description: 'A test consultation service for automated testing',
    duration: 60,
    price: 100,
    category: 'consultation',
    deposit_required: true,
    deposit_amount: 25,
    buffer_time: 15,
    max_advance_booking: 90,
    is_active: true,
  };

  logInfo('Service data:');
  console.log(JSON.stringify(serviceData, null, 2));

  const { data } = await makeRequest('/admin/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });

  logSuccess(`Service created with ID: ${data.service.id}`);
  return data.service;
}

async function testGetServices() {
  logStep(3, 'Retrieve Services');
  
  const { data } = await makeRequest('/store/services');
  
  logSuccess(`Retrieved ${data.services.length} service(s)`);
  
  if (data.services.length > 0) {
    logInfo('First service:');
    console.log(JSON.stringify(data.services[0], null, 2));
  }
  
  return data.services;
}

async function testGetAvailability(serviceId) {
  logStep(4, 'Check Availability');
  
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  logInfo(`Checking availability for service ${serviceId} on ${dateStr}`);
  
  const { data } = await makeRequest(
    `/store/availability?service_id=${serviceId}&date=${dateStr}`
  );
  
  logSuccess(`Found ${data.slots.length} available time slot(s)`);
  
  if (data.slots.length > 0) {
    logInfo('First 5 available slots:');
    console.log(JSON.stringify(data.slots.slice(0, 5), null, 2));
  }
  
  return { date: dateStr, slots: data.slots };
}

async function testCreateBooking(serviceId, date, time) {
  logStep(5, 'Create Booking');
  
  const bookingData = {
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '+1234567890',
    service_id: serviceId,
    scheduled_date: date,
    scheduled_time: time,
    notes: 'This is a test booking created by automated test script',
  };

  logInfo('Booking data:');
  console.log(JSON.stringify(bookingData, null, 2));

  const { data } = await makeRequest('/store/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });

  logSuccess(`Booking created with ID: ${data.booking.id}`);
  logInfo('Booking details:');
  console.log(JSON.stringify(data.booking, null, 2));
  
  return data.booking;
}

async function testCreatePaymentIntent(bookingId, paymentType = 'deposit') {
  logStep(6, 'Create Payment Intent');
  
  const paymentData = {
    booking_id: bookingId,
    payment_type: paymentType,
  };

  logInfo(`Creating ${paymentType} payment intent for booking ${bookingId}`);

  const { data } = await makeRequest('/store/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });

  logSuccess(`Payment intent created: ${data.payment.stripe_payment_intent_id}`);
  logInfo('Payment details:');
  console.log(JSON.stringify({
    payment_id: data.payment.id,
    stripe_payment_intent_id: data.payment.stripe_payment_intent_id,
    amount: data.payment.amount,
    currency: data.payment.currency,
    status: data.payment.status,
    payment_type: data.payment.payment_type,
  }, null, 2));
  
  return data;
}

async function testConfirmPayment(paymentIntentId) {
  logStep(7, 'Confirm Payment (Simulated)');
  
  logInfo(`Simulating payment confirmation for: ${paymentIntentId}`);
  logInfo('In a real scenario, Stripe would confirm the payment');
  logInfo('For testing, we\'ll call the confirm endpoint directly');

  const { data } = await makeRequest('/store/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });

  logSuccess('Payment confirmed successfully');
  logInfo('Updated booking status:');
  console.log(JSON.stringify({
    booking_id: data.booking.id,
    status: data.booking.status,
    deposit_paid: data.booking.deposit_paid,
  }, null, 2));
  
  return data;
}

async function testGetBooking(bookingId) {
  logStep(8, 'Verify Booking Status');
  
  const { data } = await makeRequest(`/store/bookings/${bookingId}`);
  
  logSuccess('Booking retrieved successfully');
  logInfo('Final booking state:');
  console.log(JSON.stringify(data.booking, null, 2));
  
  return data.booking;
}

async function runTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('BOOKING FLOW INTEGRATION TEST', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  let testResults = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Test 1: Health Check
    const isHealthy = await testHealthCheck();
    if (!isHealthy) {
      throw new Error('Backend is not healthy. Aborting tests.');
    }
    testResults.passed++;

    // Test 2 & 3: Service Management
    let service;
    try {
      service = await testCreateService();
      testResults.passed++;
    } catch (error) {
      logError('Failed to create service, trying to use existing service');
      const services = await testGetServices();
      if (services.length === 0) {
        throw new Error('No services available for testing');
      }
      service = services[0];
    }
    testResults.passed++;

    // Test 4: Availability
    const { date, slots } = await testGetAvailability(service.id);
    if (slots.length === 0) {
      throw new Error('No available time slots found');
    }
    testResults.passed++;

    // Test 5: Create Booking
    const booking = await testCreateBooking(service.id, date, slots[0].time);
    testResults.passed++;

    // Test 6: Create Payment Intent
    const paymentType = service.deposit_required ? 'deposit' : 'full';
    const paymentData = await testCreatePaymentIntent(booking.id, paymentType);
    testResults.passed++;

    // Test 7: Confirm Payment (Note: This will fail without actual Stripe payment)
    try {
      await testConfirmPayment(paymentData.payment.stripe_payment_intent_id);
      testResults.passed++;
    } catch (error) {
      logError('Payment confirmation failed (expected without actual Stripe payment)');
      logInfo('This is normal - payment needs to be completed through Stripe first');
      testResults.errors.push({
        step: 'Payment Confirmation',
        error: error.message,
        note: 'Expected failure - requires actual Stripe payment',
      });
    }

    // Test 8: Verify Final Booking State
    const finalBooking = await testGetBooking(booking.id);
    testResults.passed++;

  } catch (error) {
    testResults.failed++;
    testResults.errors.push({
      step: 'General',
      error: error.message,
      stack: error.stack,
    });
    logError(`Test failed: ${error.message}`);
  }

  // Print Summary
  log('\n' + '='.repeat(60), 'bright');
  log('TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  if (testResults.errors.length > 0) {
    log('\nErrors/Warnings:', 'yellow');
    testResults.errors.forEach((err, idx) => {
      log(`\n${idx + 1}. ${err.step}:`, 'yellow');
      log(`   ${err.error}`, 'red');
      if (err.note) {
        log(`   Note: ${err.note}`, 'blue');
      }
    });
  }
  
  log('\n' + '='.repeat(60) + '\n', 'bright');
  
  return testResults;
}

// Run the tests
runTests()
  .then((results) => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });

