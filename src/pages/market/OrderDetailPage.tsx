import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../../lib/api"
import { NEXT_ORDER_STATUSES, ORDER_STATUS_LABELS, type Order, type OrderStatus } from "../../lib/types"
import { useAuth } from "../../context/AuthContext"
import { formatDateTime, formatMoney } from "../../lib/format"
import { OrderStatusBadge } from "../../components/market/OrderStatusBadge"
import { ErrorState } from "../../components/ui/StatePanel"
import { SkeletonCard } from "../../components/ui/Skeleton"

const PAYMENT_IN_FLIGHT_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_PROCESSING"]
// Faster than the backend's own 30s reconciliation cadence so a resolved payment
// shows up quickly once it lands, without hammering the API while genuinely pending.
const POLL_INTERVAL_MS = 4000

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    api
      .get<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load order"))
  }, [id])

  useEffect(load, [load])

  // The backend never confirms payment on the client's say-so — this order was created
  // PAYMENT_PROCESSING and only PaymentReconciliationService (polling the provider every
  // 30s, or an auto-expiry after the processing timeout) moves it to PAID/CANCELLED. Poll
  // here purely so that resolution shows up without the buyer having to manually refresh.
  useEffect(() => {
    if (!order || !PAYMENT_IN_FLIGHT_STATUSES.includes(order.status)) {
      return
    }
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [order, load])

  async function moveTo(status: OrderStatus) {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      setOrder(await api.patch<Order>(`/orders/${id}/status`, { status }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order")
    } finally {
      setBusy(false)
    }
  }

  if (error && !order) {
    return (
      <div className="page">
        <ErrorState title="We couldn't load this order" description={error} onRetry={load} />
      </div>
    )
  }
  if (!order) {
    return (
      <div className="page">
        <SkeletonCard lines={5} />
      </div>
    )
  }

  const isSeller = user && order.buyerId !== user.id
  const nextSteps = NEXT_ORDER_STATUSES[order.status]

  return (
    <div className="page stack">
      <div className="card stack">
        <div className="row between">
          <div>
            <h1>Order at {order.businessName}</h1>
            <p className="muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {PAYMENT_IN_FLIGHT_STATUSES.includes(order.status) && (
          <div className="callout" role="status" aria-live="polite">
            Your payment is still being confirmed by the mobile money provider. This page will
            update automatically once it settles — no need to refresh.
          </div>
        )}

        <ul className="cart-line-list">
          {order.items.map((item) => (
            <li key={item.productId} className="cart-line">
              <div>
                <strong>{item.productName}</strong>
                <div className="muted">
                  {item.quantity} × {formatMoney(item.unitPrice, order.currency)}
                </div>
              </div>
              <span className="money">{formatMoney(item.lineTotal, order.currency)}</span>
            </li>
          ))}
        </ul>

        <div className="row between">
          <span>Subtotal</span>
          <span className="money">{formatMoney(order.subtotal, order.currency)}</span>
        </div>
        <div className="row between">
          <strong>Total</strong>
          <strong className="money">{formatMoney(order.total, order.currency)}</strong>
        </div>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        {isSeller && nextSteps.length > 0 && (
          <div className="row wrap">
            {nextSteps.map((status) => (
              <button key={status} className="btn btn-primary btn-sm" disabled={busy} onClick={() => moveTo(status)}>
                Mark as {ORDER_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
