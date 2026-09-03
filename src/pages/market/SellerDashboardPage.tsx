import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Package, Plus, Store } from "lucide-react"
import { api, ApiError } from "../../lib/api"
import type { Business, Order, Page, Product, SellerDashboard } from "../../lib/types"
import { formatDateTime, formatMoney } from "../../lib/format"
import { useCurrencyConfig } from "../../lib/currencyConfig"
import { CreateBusinessModal } from "../../components/market/CreateBusinessModal"
import { ProductFormModal } from "../../components/market/ProductFormModal"
import { OrderStatusBadge } from "../../components/market/OrderStatusBadge"
import { PageHeader } from "../../components/ui/PageHeader"
import { Button } from "../../components/ui/Button"
import { StatCard } from "../../components/ui/StatCard"
import { MoneyDisplay } from "../../components/ui/MoneyDisplay"
import { EmptyState } from "../../components/ui/StatePanel"
import { SkeletonCard, SkeletonGrid } from "../../components/ui/Skeleton"

type Tab = "overview" | "products" | "orders"

export function SellerDashboardPage() {
  const { defaultCurrency } = useCurrencyConfig()
  const [business, setBusiness] = useState<Business | null>(null)
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [tab, setTab] = useState<Tab>("overview")

  const [stats, setStats] = useState<SellerDashboard | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const loadBusiness = useCallback(() => {
    api
      .get<Business>("/businesses/me")
      .then((b) => {
        setBusiness(b)
        setHasBusiness(true)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setHasBusiness(false)
        }
      })
  }, [])

  useEffect(loadBusiness, [loadBusiness])

  const loadStats = useCallback(() => {
    api.get<SellerDashboard>("/seller/dashboard").then(setStats).catch(() => setStats(null))
  }, [])

  const loadProducts = useCallback(() => {
    if (!business) return
    api
      .get<Page<Product>>(`/businesses/${business.id}/products?size=100`)
      .then((page) => setProducts(page.content))
      .catch(() => setProducts([]))
  }, [business])

  const loadOrders = useCallback(() => {
    api
      .get<Page<Order>>("/orders/selling?size=50")
      .then((page) => setOrders(page.content))
      .catch(() => setOrders([]))
  }, [])

  async function archiveProduct(product: Product) {
    if (!window.confirm(`Archive "${product.name}"? It will no longer be visible to buyers.`)) {
      return
    }
    setArchivingId(product.id)
    try {
      await api.del(`/products/${product.id}`)
      loadProducts()
    } catch {
      // loadProducts() re-fetching the true state below is enough recovery — no separate error UI needed
      // for what's a low-stakes, retryable seller action.
      loadProducts()
    } finally {
      setArchivingId(null)
    }
  }

  useEffect(() => {
    if (!business) return
    loadStats()
    loadProducts()
    loadOrders()
  }, [business, loadStats, loadProducts, loadOrders])

  if (hasBusiness === null) {
    return (
      <div className="page">
        <SkeletonCard lines={2} />
      </div>
    )
  }

  if (!hasBusiness) {
    return (
      <div className="page">
        <EmptyState
          icon={<Store size={22} aria-hidden="true" />}
          title="Start selling on MoMoMarket"
          description="Set up a seller profile to list products or services and start receiving orders."
          action={<Button onClick={() => setShowOnboarding(true)}>Set up seller profile</Button>}
        />
        {showOnboarding && (
          <CreateBusinessModal
            onClose={() => setShowOnboarding(false)}
            onCreated={() => {
              setShowOnboarding(false)
              loadBusiness()
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="page stack">
      <PageHeader
        title={business!.name}
        subtitle="Your MoMoMarket seller dashboard."
        actions={
          <Link to={`/market/businesses/${business!.id}`} className="btn btn-ghost btn-sm">
            View storefront
          </Link>
        }
      />

      <div className="tab-bar" role="tablist">
        {(["overview", "products", "orders"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="stack">
          {stats ? (
            <div className="grid grid-3">
              <StatCard label="Total sales" value={<MoneyDisplay amount={stats.totalSales} currency={stats.currency ?? defaultCurrency} size="md" />} />
              <StatCard label="This month" value={<MoneyDisplay amount={stats.monthSales} currency={stats.currency ?? defaultCurrency} size="md" />} />
              <StatCard label="This week" value={<MoneyDisplay amount={stats.weekSales} currency={stats.currency ?? defaultCurrency} size="md" />} />
              <StatCard label="Total orders" value={<span className="money-display money-display-md">{stats.totalOrders}</span>} />
              <StatCard label="Pending orders" value={<span className="money-display money-display-md">{stats.pendingOrders}</span>} />
              <StatCard label="Completed orders" value={<span className="money-display money-display-md">{stats.completedOrders}</span>} />
            </div>
          ) : (
            <SkeletonGrid count={3} />
          )}

          {stats && stats.topProducts.length > 0 && (
            <div className="card">
              <h2>Top products</h2>
              <ul className="stack">
                {stats.topProducts.map((p) => (
                  <li key={p.id} className="row between">
                    <span>{p.name}</span>
                    <span className="money">{formatMoney(p.price, p.currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="stack">
          <div className="row between">
            <h2>Your listings</h2>
            <Button size="sm" onClick={() => setShowNewProduct(true)}>
              <Plus size={14} aria-hidden="true" /> New listing
            </Button>
          </div>
          {products === null ? (
            <SkeletonGrid count={3} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Package size={22} aria-hidden="true" />}
              title="You haven't listed anything yet"
              description="Add your first product or service to start selling."
              action={<Button onClick={() => setShowNewProduct(true)}>+ New listing</Button>}
            />
          ) : (
            <ul className="stack">
              {products.map((p) => (
                <li key={p.id} className="card row between">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="muted">
                      {formatMoney(p.price, p.currency)} · {p.isService ? "Service" : `${p.stock} in stock`}
                    </div>
                  </div>
                  <div className="row">
                    <span className={`badge ${p.status === "ACTIVE" ? "success" : p.status === "OUT_OF_STOCK" ? "failed" : ""}`}>
                      {p.status}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingProduct(p)}>
                      Edit
                    </button>
                    {p.status !== "ARCHIVED" && (
                      <button
                        className="btn btn-ghost btn-sm danger"
                        onClick={() => archiveProduct(p)}
                        disabled={archivingId === p.id}
                      >
                        {archivingId === p.id ? "Archiving…" : "Archive"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="stack">
          <h2>Incoming orders</h2>
          {orders === null ? (
            <div className="stack">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders from buyers will show up here." />
          ) : (
            <ul className="order-list">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="order-row card">
                    <div>
                      <strong>{o.buyerName}</strong>
                      <div className="muted">
                        {o.items.length} item{o.items.length === 1 ? "" : "s"} · {formatDateTime(o.createdAt)}
                      </div>
                    </div>
                    <div className="row">
                      <span className="money">{formatMoney(o.total, o.currency)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showNewProduct && (
        <ProductFormModal
          onClose={() => setShowNewProduct(false)}
          onSaved={() => {
            setShowNewProduct(false)
            loadProducts()
          }}
        />
      )}
      {editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSaved={() => {
            setEditingProduct(undefined)
            loadProducts()
          }}
        />
      )}
    </div>
  )
}
