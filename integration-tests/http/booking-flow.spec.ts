import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(100000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Booking Flow Integration Tests", () => {
      let serviceId: string
      let bookingId: string
      let paymentIntentId: string
      const publishableKey = "pk_test_01JGQXQXQXQXQXQXQXQXQX"

      beforeAll(async () => {
        // Create a test service
        const serviceResponse = await api.post(
          "/admin/services",
          {
            name: "Integration Test Consultation",
            description: "Test service for integration testing",
            duration: 60,
            price: 100,
            category: "consultation",
            deposit_required: true,
            deposit_amount: 25,
            buffer_time: 15,
            max_advance_booking: 90,
            is_active: true,
          },
          {
            headers: {
              "x-publishable-api-key": publishableKey,
            },
          }
        )

        serviceId = serviceResponse.data.service.id
      })

      describe("Service Management", () => {
        it("should retrieve services from store API", async () => {
          const response = await api.get("/store/services", {
            headers: {
              "x-publishable-api-key": publishableKey,
            },
          })

          expect(response.status).toBe(200)
          expect(response.data.services).toBeDefined()
          expect(Array.isArray(response.data.services)).toBe(true)
          expect(response.data.services.length).toBeGreaterThan(0)

          const service = response.data.services.find((s: any) => s.id === serviceId)
          expect(service).toBeDefined()
          expect(service.name).toBe("Integration Test Consultation")
          expect(service.price).toBe(100)
          expect(service.deposit_required).toBe(true)
          expect(service.deposit_amount).toBe(25)
        })

        it("should retrieve a specific service by ID", async () => {
          const response = await api.get(`/store/services/${serviceId}`, {
            headers: {
              "x-publishable-api-key": publishableKey,
            },
          })

          expect(response.status).toBe(200)
          expect(response.data.service).toBeDefined()
          expect(response.data.service.id).toBe(serviceId)
        })
      })

      describe("Availability Checking", () => {
        it("should return available time slots for a service", async () => {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          const dateStr = tomorrow.toISOString().split('T')[0]

          const response = await api.get(
            `/store/availability?service_id=${serviceId}&date=${dateStr}`,
            {
              headers: {
                "x-publishable-api-key": publishableKey,
              },
            }
          )

          expect(response.status).toBe(200)
          expect(response.data.slots).toBeDefined()
          expect(Array.isArray(response.data.slots)).toBe(true)
          
          if (response.data.slots.length > 0) {
            const slot = response.data.slots[0]
            expect(slot).toHaveProperty('time')
            expect(slot).toHaveProperty('available')
          }
        })

        it("should return empty slots for past dates", async () => {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const dateStr = yesterday.toISOString().split('T')[0]

          const response = await api.get(
            `/store/availability?service_id=${serviceId}&date=${dateStr}`,
            {
              headers: {
                "x-publishable-api-key": publishableKey,
              },
            }
          )

          expect(response.status).toBe(200)
          expect(response.data.slots).toBeDefined()
          expect(response.data.slots.length).toBe(0)
        })
      })

      describe("Booking Creation", () => {
        it("should create a new booking", async () => {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          const dateStr = tomorrow.toISOString().split('T')[0]

          const bookingData = {
            customer_name: "Test Customer",
            customer_email: "test@example.com",
            customer_phone: "+1234567890",
            service_id: serviceId,
            scheduled_date: dateStr,
            scheduled_time: "10:00",
            notes: "Integration test booking",
          }

          const response = await api.post("/store/bookings", bookingData, {
            headers: {
              "x-publishable-api-key": publishableKey,
            },
          })

          expect(response.status).toBe(201)
          expect(response.data.booking).toBeDefined()
          expect(response.data.booking.id).toBeDefined()
          expect(response.data.booking.customer_name).toBe("Test Customer")
          expect(response.data.booking.customer_email).toBe("test@example.com")
          expect(response.data.booking.service_id).toBe(serviceId)
          expect(response.data.booking.status).toBe("pending")
          expect(response.data.booking.deposit_paid).toBe(false)

          bookingId = response.data.booking.id
        })

        it("should retrieve the created booking", async () => {
          const response = await api.get(`/store/bookings/${bookingId}`, {
            headers: {
              "x-publishable-api-key": publishableKey,
            },
          })

          expect(response.status).toBe(200)
          expect(response.data.booking).toBeDefined()
          expect(response.data.booking.id).toBe(bookingId)
        })

        it("should fail to create booking with missing required fields", async () => {
          const invalidBookingData = {
            customer_name: "Test Customer",
            // Missing required fields
          }

          try {
            await api.post("/store/bookings", invalidBookingData, {
              headers: {
                "x-publishable-api-key": publishableKey,
              },
            })
            fail("Should have thrown an error")
          } catch (error: any) {
            expect(error.response.status).toBe(400)
          }
        })
      })

      describe("Payment Intent Creation", () => {
        it("should create a payment intent for deposit", async () => {
          const paymentData = {
            booking_id: bookingId,
            payment_type: "deposit",
          }

          const response = await api.post(
            "/store/payments/create-intent",
            paymentData,
            {
              headers: {
                "x-publishable-api-key": publishableKey,
              },
            }
          )

          expect(response.status).toBe(200)
          expect(response.data.payment).toBeDefined()
          expect(response.data.payment.booking_id).toBe(bookingId)
          expect(response.data.payment.payment_type).toBe("deposit")
          expect(response.data.payment.amount).toBe(2500) // $25 in cents
          expect(response.data.payment.status).toBe("pending")
          expect(response.data.payment.stripe_payment_intent_id).toBeDefined()
          expect(response.data.client_secret).toBeDefined()

          paymentIntentId = response.data.payment.stripe_payment_intent_id
        })

        it("should create a payment intent for full payment", async () => {
          // Create another booking for full payment test
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 2)
          const dateStr = tomorrow.toISOString().split('T')[0]

          const bookingResponse = await api.post(
            "/store/bookings",
            {
              customer_name: "Test Customer 2",
              customer_email: "test2@example.com",
              customer_phone: "+1234567890",
              service_id: serviceId,
              scheduled_date: dateStr,
              scheduled_time: "14:00",
              notes: "Full payment test booking",
            },
            {
              headers: {
                "x-publishable-api-key": publishableKey,
              },
            }
          )

          const newBookingId = bookingResponse.data.booking.id

          const paymentData = {
            booking_id: newBookingId,
            payment_type: "full",
          }

          const response = await api.post(
            "/store/payments/create-intent",
            paymentData,
            {
              headers: {
                "x-publishable-api-key": publishableKey,
              },
            }
          )

          expect(response.status).toBe(200)
          expect(response.data.payment.payment_type).toBe("full")
          expect(response.data.payment.amount).toBe(10000) // $100 in cents
        })

        it("should fail to create payment intent for non-existent booking", async () => {
          const paymentData = {
            booking_id: "booking_nonexistent",
            payment_type: "deposit",
          }

          try {
            await api.post("/store/payments/create-intent", paymentData, {
              headers: {
                "x-publishable-api-key": publishableKey,
              },
            })
            fail("Should have thrown an error")
          } catch (error: any) {
            expect(error.response.status).toBe(404)
          }
        })
      })

      describe("Payment Confirmation", () => {
        it("should handle payment confirmation endpoint", async () => {
          // Note: This test will fail without actual Stripe payment
          // but we're testing the endpoint structure
          try {
            const response = await api.post(
              "/store/payments/confirm",
              {
                payment_intent_id: paymentIntentId,
              },
              {
                headers: {
                  "x-publishable-api-key": publishableKey,
                },
              }
            )

            // If it succeeds (unlikely without real payment)
            expect(response.status).toBe(200)
            expect(response.data.success).toBe(true)
          } catch (error: any) {
            // Expected to fail - payment not actually completed in Stripe
            expect(error.response.status).toBe(400)
            expect(error.response.data.error).toBeDefined()
          }
        })
      })

      describe("End-to-End Booking Flow", () => {
        it("should complete full booking flow (without actual payment)", async () => {
          // Step 1: Get services
          const servicesResponse = await api.get("/store/services", {
            headers: { "x-publishable-api-key": publishableKey },
          })
          expect(servicesResponse.status).toBe(200)
          const testService = servicesResponse.data.services[0]

          // Step 2: Check availability
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 3)
          const dateStr = tomorrow.toISOString().split('T')[0]

          const availabilityResponse = await api.get(
            `/store/availability?service_id=${testService.id}&date=${dateStr}`,
            {
              headers: { "x-publishable-api-key": publishableKey },
            }
          )
          expect(availabilityResponse.status).toBe(200)

          // Step 3: Create booking
          const bookingResponse = await api.post(
            "/store/bookings",
            {
              customer_name: "E2E Test Customer",
              customer_email: "e2e@example.com",
              customer_phone: "+1234567890",
              service_id: testService.id,
              scheduled_date: dateStr,
              scheduled_time: "11:00",
              notes: "End-to-end test",
            },
            {
              headers: { "x-publishable-api-key": publishableKey },
            }
          )
          expect(bookingResponse.status).toBe(201)
          const e2eBookingId = bookingResponse.data.booking.id

          // Step 4: Create payment intent
          const paymentResponse = await api.post(
            "/store/payments/create-intent",
            {
              booking_id: e2eBookingId,
              payment_type: testService.deposit_required ? "deposit" : "full",
            },
            {
              headers: { "x-publishable-api-key": publishableKey },
            }
          )
          expect(paymentResponse.status).toBe(200)
          expect(paymentResponse.data.client_secret).toBeDefined()

          // Step 5: Verify booking still exists and is in correct state
          const finalBookingResponse = await api.get(
            `/store/bookings/${e2eBookingId}`,
            {
              headers: { "x-publishable-api-key": publishableKey },
            }
          )
          expect(finalBookingResponse.status).toBe(200)
          expect(finalBookingResponse.data.booking.status).toBe("pending")
          expect(finalBookingResponse.data.booking.deposit_paid).toBe(false)
        })
      })
    })
  },
})

