"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCard } from "@medusajs/icons"
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface Payment {
  id: string
  booking_id: string
  customer_email: string
  amount: number
  currency: string
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded"
  payment_type: "full" | "deposit"
  created_at: string
  stripe_payment_intent_id: string
  refund_amount?: number
  refund_reason?: string
}

interface Stats {
  total: number
  succeeded: number
  pending: number
  failed: number
  refunded: number
  total_amount: number
}

const PaymentManagementPage = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [showRefundModal, setShowRefundModal] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/payments")
      if (!response.ok) throw new Error("Failed to fetch payments")
      const data = await response.json()
      setPayments(data.payments || [])
      setStats(data.stats || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payments")
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (paymentId: string) => {
    try {
      const response = await fetch("/admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: paymentId,
          reason: refundReason || "Customer requested",
        }),
      })

      if (!response.ok) throw new Error("Failed to process refund")

      setRefundingId(null)
      setRefundReason("")
      setShowRefundModal(false)
      await fetchPayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process refund")
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string): "green" | "red" | "blue" | "purple" | "orange" | "grey" | undefined => {
    switch (status) {
      case "succeeded":
        return "green"
      case "pending":
        return "orange"
      case "failed":
        return "red"
      case "refunded":
        return "grey"
      default:
        return "blue"
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Heading level="h1">Payment Management</Heading>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base animate-pulse">
              <div className="h-4 bg-ui-bg-disabled rounded mb-2"></div>
              <div className="h-8 bg-ui-bg-disabled rounded mb-2"></div>
              <div className="h-3 bg-ui-bg-disabled rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base animate-pulse">
          <div className="p-4 border-b border-ui-border-base">
            <div className="h-6 bg-ui-bg-disabled rounded w-1/4"></div>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-ui-bg-disabled rounded"></div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Payment Management</Heading>
        <Button onClick={fetchPayments} variant="secondary">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-ui-bg-error-subtle border border-ui-border-error rounded-lg flex justify-between items-center">
          <div>
            <p className="text-ui-fg-error font-medium">Error Loading Payments</p>
            <p className="text-ui-fg-error text-sm mt-1">{error}</p>
          </div>
          <Button
            onClick={fetchPayments}
            variant="primary"
            className="whitespace-nowrap ml-4"
          >
            Retry
          </Button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Total Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
            <div className="text-xs text-ui-fg-muted mt-1">{stats.succeeded} payments</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Pending</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Awaiting payment</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Succeeded</div>
            <div className="text-2xl font-bold text-green-600">{stats.succeeded}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Completed</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Payment errors</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Refunded</div>
            <div className="text-2xl font-bold text-ui-fg-muted">{stats.refunded}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Refunded payments</div>
          </div>
        </div>
      )}

      <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <div className="p-4 border-b border-ui-border-base">
          <Heading level="h2">All Payments</Heading>
        </div>
        <div className="p-4">
          {payments.length === 0 ? (
            <p className="text-ui-fg-subtle">No payments found</p>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Booking ID</Table.HeaderCell>
                  <Table.HeaderCell>Amount</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {payments.map((payment) => (
                  <Table.Row key={payment.id}>
                    <Table.Cell>{payment.customer_email}</Table.Cell>
                    <Table.Cell className="text-xs">{payment.booking_id}</Table.Cell>
                    <Table.Cell>{formatCurrency(payment.amount)}</Table.Cell>
                    <Table.Cell>
                      <Badge color={payment.payment_type === "deposit" ? "purple" : "blue"}>
                        {payment.payment_type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatDate(payment.created_at)}</Table.Cell>
                    <Table.Cell>
                      {payment.status === "succeeded" && (
                        <button
                          onClick={() => {
                            setRefundingId(payment.id)
                            setShowRefundModal(true)
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Refund
                        </button>
                      )}
                      {payment.status === "refunded" && (
                        <span className="text-xs text-gray-500">Refunded</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </div>

      {showRefundModal && refundingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Process Refund</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason (optional)</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Customer requested..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRefundModal(false)
                  setRefundingId(null)
                  setRefundReason("")
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRefund(refundingId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payments",
  icon: CreditCard,
})

export default PaymentManagementPage
