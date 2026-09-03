import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../lib/api"
import type { Order, Page } from "../../lib/types"
import { formatDateTime, formatMoney } from "../../lib/format"
import { OrderStatusBadge } from "../../components/market/OrderStatusBadge"
import { PageHeader } from "../../components/ui/PageHeader"
import { Button } from "../../components/ui/Button"
import { EmptyState, ErrorState } from "../../components/ui/StatePanel"
import { SkeletonCard } from "../../components/ui/Skeleton"

export function OrdersPage() {
  const [page, setPage] = useState<Page<Order> | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    api
      .get<Page<Order>>("/orders/mine?size=50")
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load orders"))
  }

  useEffect(load, [])

  return (
    <div className="page">
      <PageHeader title="Your orders" subtitle="Everything you've bought on MoMoMarket." />

      {error && <ErrorState description={error} onRetry={load} />}

      {page === null ? (
        <div className="stack">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : page.content.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you buy something on MoMoMarket, it'll show up here."
          action={
            <Link to="/market">
              <Button>Explore Market</Button>
            </Link>
          }
        />
      ) : (
        <ul className="order-list">
          {page.content.map((order) => (
            <li key={order.id}>
              <Link to={`/orders/${order.id}`} className="order-row card">
                <div>
                  <strong>{order.businessName}</strong>
                  <div className="muted">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"} · {formatDateTime(order.createdAt)}
                  </div>
                </div>
                <div className="row">
                  <span className="money">{formatMoney(order.total, order.currency)}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
