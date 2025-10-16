#!/usr/bin/env node

/**
 * Quick Booking Flow Test
 * Run with: node quick-test.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BACKEND_URL = 'http://localhost:9000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePublishableKey() {
  const directEnvKey =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    process.env.MEDUSA_PUBLISHABLE_KEY;

  if (directEnvKey) {
    return directEnvKey.trim();
  }

  const storefrontEnvPath = path.resolve(
    __dirname,
    '../skinLair-storefront/.env.local'
  );

  if (fs.existsSync(storefrontEnvPath)) {
    const envContent = fs.readFileSync(storefrontEnvPath, 'utf-8');

    for (const line of envContent.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) {
        continue;
      }

      const [key, ...valueParts] = line.split('=');
      if (!key || !valueParts.length) {
        continue;
      }

      const value = valueParts.join('=').trim();

      if (key.trim() === 'NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY' && value) {
        return value;
      }
    }
  }

  return undefined;
}

const PUBLISHABLE_KEY = resolvePublishableKey();

if (!PUBLISHABLE_KEY) {
  console.error(
    '\n✗ Unable to locate NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY.\n' +
      '  • Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in your environment before running this script,\n' +
      '    or ensure skinLair-storefront/.env.local contains the key.\n'
  );
  process.exit(1);
}

console.log('\n===========================================');
console.log('BOOKING FLOW QUICK TEST');
console.log('===========================================\n');

async function test() {
  try {
    // Test 1: Health Check
    console.log('1. Testing backend health...');
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.text();
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Response: ${healthData}`);
    
    if (!healthRes.ok) {
      throw new Error('Backend is not healthy');
    }
    console.log('   ✓ Backend is running\n');

    // Test 2: Get Services
    console.log('2. Getting services...');
    const servicesRes = await fetch(`${BACKEND_URL}/store/services`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
    });
    const servicesData = await servicesRes.json();
    console.log(`   Status: ${servicesRes.status}`);
    console.log(`   Services found: ${servicesData.services?.length || 0}`);
    
    if (servicesData.services && servicesData.services.length > 0) {
      console.log(`   First service: ${servicesData.services[0].name}`);
      console.log(`   ✓ Services retrieved\n`);
      
      const service = servicesData.services[0];
      
      // Test 3: Check Availability
      console.log('3. Checking availability...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const availRes = await fetch(
        `${BACKEND_URL}/store/availability?service_id=${service.id}&date=${dateStr}`,
        {
          headers: {
            'x-publishable-api-key': PUBLISHABLE_KEY,
          },
        }
      );
      const availData = await availRes.json();
      console.log(`   Status: ${availRes.status}`);
      console.log(`   Date: ${dateStr}`);
      console.log(`   Slots found: ${availData.slots?.length || 0}`);
      
      if (availData.slots && availData.slots.length > 0) {
        console.log(`   First slot: ${availData.slots[0].time}`);
        console.log(`   ✓ Availability checked\n`);
        
        // Test 4: Create Booking
        console.log('4. Creating booking...');
        const bookingData = {
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+1234567890',
          service_id: service.id,
          scheduled_date: dateStr,
          scheduled_time: availData.slots[0].time,
          notes: 'Quick test booking',
        };
        
        const bookingRes = await fetch(`${BACKEND_URL}/store/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': PUBLISHABLE_KEY,
          },
          body: JSON.stringify(bookingData),
        });
        const bookingResData = await bookingRes.json();
        console.log(`   Status: ${bookingRes.status}`);
        
        if (bookingRes.ok && bookingResData.booking) {
          console.log(`   Booking ID: ${bookingResData.booking.id}`);
          console.log(`   Status: ${bookingResData.booking.status}`);
          console.log(`   ✓ Booking created\n`);
          
          // Test 5: Create Payment Intent
          console.log('5. Creating payment intent...');
          const paymentType = service.deposit_required ? 'deposit' : 'full';
          const paymentData = {
            booking_id: bookingResData.booking.id,
            payment_type: paymentType,
          };
          
          const paymentRes = await fetch(`${BACKEND_URL}/store/payments/create-intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': PUBLISHABLE_KEY,
            },
            body: JSON.stringify(paymentData),
          });
          const paymentResData = await paymentRes.json();
          console.log(`   Status: ${paymentRes.status}`);
          
          if (paymentRes.ok && paymentResData.payment) {
            console.log(`   Payment ID: ${paymentResData.payment.id}`);
            console.log(`   Amount: $${paymentResData.payment.amount / 100}`);
            console.log(`   Type: ${paymentResData.payment.payment_type}`);
            console.log(`   Stripe PI: ${paymentResData.payment.stripe_payment_intent_id}`);
            console.log(`   ✓ Payment intent created\n`);
            
            // Test 6: Verify Booking
            console.log('6. Verifying booking...');
            const verifyRes = await fetch(
              `${BACKEND_URL}/store/bookings/${bookingResData.booking.id}`,
              {
                headers: {
                  'x-publishable-api-key': PUBLISHABLE_KEY,
                },
              }
            );
            const verifyData = await verifyRes.json();
            console.log(`   Status: ${verifyRes.status}`);
            console.log(`   Booking Status: ${verifyData.booking?.status}`);
            console.log(`   Deposit Paid: ${verifyData.booking?.deposit_paid}`);
            console.log(`   ✓ Booking verified\n`);
            
            console.log('===========================================');
            console.log('✓ ALL TESTS PASSED');
            console.log('===========================================\n');
            console.log('Summary:');
            console.log(`- Service: ${service.name}`);
            console.log(`- Booking ID: ${bookingResData.booking.id}`);
            console.log(`- Scheduled: ${dateStr} at ${availData.slots[0].time}`);
            console.log(`- Payment Amount: $${paymentResData.payment.amount / 100}`);
            console.log(`- Payment Type: ${paymentType}`);
            console.log('\nNote: Payment is pending. Complete payment through Stripe to confirm booking.\n');
            
          } else {
            console.log(`   ✗ Payment intent creation failed`);
            console.log(`   Error: ${JSON.stringify(paymentResData)}`);
          }
        } else {
          console.log(`   ✗ Booking creation failed`);
          console.log(`   Error: ${JSON.stringify(bookingResData)}`);
        }
      } else {
        console.log(`   ✗ No availability found for ${dateStr}\n`);
      }
    } else {
      console.log(`   ✗ No services found\n`);
      console.log('   Please create a service first using the admin panel or API\n');
    }
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

test();

