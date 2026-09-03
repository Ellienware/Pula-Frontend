import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Trash2 } from "lucide-react"
import { api } from "../../lib/api"
import type { Order } from "../../lib/types"
import { formatMoney } from "../../lib/format"
import { useMarket } from "../../context/MarketContext"
import { PageHeader } from "../../components/ui/PageHeader"
import { Button } from "../../components/ui/Button"
import { EmptyState, ErrorState } from "../../components/ui/StatePanel"

export function CartPage() {
  const { cart, updateCartItem, removeCartItem, refreshCart } = useMarket()
  const navigate = useNavigate()
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const groups = useMemo(() => {
    if (!cart) return []
    const byBusiness = new Map<string, { businessId: string; businessName: string; items: typeof cart.items }>()
    for (const item of cart.items) {
      const key = item.product.businessId
      if (!byBusiness.has(key)) {
        byBusiness.set(key, { businessId: key, businessName: item.product.businessName, items: [] })
      }
      byBusiness.get(key)!.items.push(item)
    }
    return [...byBusiness.values()]
  }, [cart])

  async function checkout(businessId: string) {
    setCheckingOut(businessId)
    setError(null)
    try {
      const idempotencyKey = crypto.randomUUID()
      const order = await api.post<Order>("/orders/checkout", { businessId }, { "Idempotency-Key": idempotencyKey })
      await refreshCart()
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
    } finally {
      setCheckingOut(null)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="page">
        <PageHeader title="Your cart" />
        <EmptyState
          title="Your cart is empty"
          description="Browse MoMoMarket to find something to add."
          action={
            <Link to="/market">
              <Button>Explore Market</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="page stack">
      <PageHeader title="Your cart" />
      {error && <ErrorState title="Checkout failed" description={error} />}
      {groups.map((group) => {
        const subtotal = group.items.reduce((sum, i) => sum + i.lineTotal, 0)
        const currency = group.items[0].product.currency
        return (
          <div key={group.businessId} className="card stack">
            <h2>{group.businessName}</h2>
            <ul className="cart-line-list">
              {group.items.map((item) => (
                <li key={item.id} className="cart-line">
                  <div>
                    <strong>{item.product.name}</strong>
                    <div className="muted">{formatMoney(item.product.price, item.product.currency)} each</div>
                  </div>
                  <div className="row">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateCartItem(item.id, Math.max(1, Number(e.target.value)))}
                      className="market-qty-input"
                      aria-label={`Quantity for ${item.product.name}`}
                    />
                    <span className="money">{formatMoney(item.lineTotal, item.product.currency)}</span>
                    <button className="icon-btn" aria-label={`Remove ${item.product.name}`} onClick={() => removeCartItem(item.id)}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="row between">
              <strong>Subtotal: {formatMoney(subtotal, currency)}</strong>
              <Button onClick={() => checkout(group.businessId)} loading={checkingOut === group.businessId}>
                Checkout with this seller
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
