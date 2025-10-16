"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingCart } from "@medusajs/icons"
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface OrderItem {
  id: string
  product_id: string
  product_title: string
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  customer_id: string
  customer?: {
    email: string
    first_name: string
    last_name: string
  }
  status: "pending" | "completed" | "canceled" | "archived"
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  items: OrderItem[]
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  pending: number
  completed: number
  cancelled: number
  total_revenue: number
}

const OrderManagementPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/orders")
      if (!response.ok) throw new Error("Failed to fetch orders")
      const data = await response.json()
      const orders = data?.orders || []
      setOrders(orders)
      // Compute stats client-side
      const stats = {
        total: orders.length,
        pending: orders.filter((o: any) => o.status === "pending").length,
        completed: orders.filter((o: any) => o.status === "completed").length,
        cancelled: orders.filter((o: any) => o.status === "canceled").length,
        total_revenue: orders
          .filter((o: any) => o.status === "completed")
          .reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      }
      setStats(stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedOrder) return

    // Temporarily disable custom refunds until backend integration is updated
    setError(
      "Refunds from this page are temporarily disabled. Please use the default Medusa Admin or issue the refund via Stripe for now."
    )
    setShowRefundModal(false)
    setSelectedOrder(null)
  }

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string): "green" | "red" | "blue" | "orange" | "grey" | "purple" | undefined => {
    switch (status) {
      case "completed":
        return "green"
      case "pending":
        return "orange"
      case "canceled":
        return "red"
      case "archived":
        return "grey"
      default:
        return "blue"
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Heading level="h1">Order Management</Heading>
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
        <Heading level="h1">Order Management</Heading>
        <Button onClick={fetchOrders} variant="secondary">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-ui-bg-error-subtle border border-ui-border-error rounded-lg flex justify-between items-center">
          <div>
            <p className="text-ui-fg-error font-medium">Error Loading Orders</p>
            <p className="text-ui-fg-error text-sm mt-1">{error}</p>
          </div>
          <Button
            onClick={fetchOrders}
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
            <div className="text-sm text-ui-fg-subtle mb-1">Total Orders</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-ui-fg-muted mt-1">All orders</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Pending</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Awaiting fulfillment</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Fulfilled</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-xs text-ui-fg-muted mt-1">Cancelled</div>
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle mb-1">Total Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
            <div className="text-xs text-ui-fg-muted mt-1">From completed orders</div>
          </div>
        </div>
      )}

      <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <div className="p-4 border-b border-ui-border-base">
          <Heading level="h2">All Orders</Heading>
        </div>
        <div className="p-4">
          {orders.length === 0 ? (
            <p className="text-ui-fg-subtle">No orders found</p>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order ID</Table.HeaderCell>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Items</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell className="text-xs font-mono">{order.id.slice(0, 8)}</Table.Cell>
                    <Table.Cell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {order.customer?.first_name} {order.customer?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{order.customer?.email}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{order.items?.length || 0} item(s)</Table.Cell>
                    <Table.Cell className="font-semibold">{formatCurrency(order.total)}</Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatDate(order.created_at)}</Table.Cell>
                    <Table.Cell>
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowDetailsModal(true)
                        }}
                        className="text-sm text-blue-600 hover:underline mr-2"
                      >
                        View
                      </button>
                      {false && order.status === "completed" && (
                        <span className="text-xs text-gray-400">Refunds temporarily disabled</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </div>

      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Order Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Order ID</p>
                <p className="font-mono text-xs">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedOrder.customer?.first_name} {selectedOrder.customer?.last_name}
                </p>
                <p className="text-xs text-gray-500">{selectedOrder.customer?.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Items</p>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="text-xs">
                    <p>{item.product_title} x {item.quantity}</p>
                    <p className="text-gray-500">{formatCurrency(item.unit_price)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between mb-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Tax:</span>
                  <span>{formatCurrency(selectedOrder.tax_total)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Shipping:</span>
                  <span>{formatCurrency(selectedOrder.shipping_total)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge color={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Process Refund</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order Total: {formatCurrency(selectedOrder.total)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Refund Amount (optional)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Leave empty for full refund"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to refund full amount</p>
            </div>
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
                  setSelectedOrder(null)
                  setRefundAmount("")
                  setRefundReason("")
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Orders",
  icon: ShoppingCart,
})

export default OrderManagementPage

