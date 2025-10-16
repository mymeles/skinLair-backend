import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("[Test] POST /store/test-payment")
  
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE)

  try {
    console.log("Testing payment creation...")
    const testPayment = await bookingModuleService.testPaymentCreation()
    
    res.json({
      success: true,
      payment: testPayment,
    })
  } catch (error: any) {
    console.error("Test payment error:", error)
    res.status(500).json({ 
      error: error.message || "Failed to create test payment",
      details: error
    })
  }
}
