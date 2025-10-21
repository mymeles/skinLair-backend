import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "@modules/booking"
import BookingModuleService from "@modules/booking/service"

/**
 * Get all payments with filtering
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const bookingModuleService = req.scope.resolve(BOOKING_MODULE) as BookingModuleService

  const { booking_id, status, customer_email } = req.query

  const filters: any = {}
  
  if (booking_id) {
    filters.booking_id = booking_id
  }
  
  if (status) {
    filters.status = status
  }

  if (customer_email) {
    filters.customer_email = customer_email
  }

  try {
    const payments = await bookingModuleService.listPayments(filters, {
      order: { created_at: "DESC" }
    })

    // Calculate statistics
    const stats = {
      total: payments.length,
      succeeded: payments.filter((p: any) => p.status === 'succeeded').length,
      pending: payments.filter((p: any) => p.status === 'pending').length,
      failed: payments.filter((p: any) => p.status === 'failed').length,
      refunded: payments.filter((p: any) => p.status === 'refunded').length,
      total_amount: payments
        .filter((p: any) => p.status === 'succeeded')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
    }

    res.json({ payments, stats })
  } catch (error: any) {
    console.error("Error fetching payments:", error)
    res.status(500).json({ error: error.message })
  }
}
