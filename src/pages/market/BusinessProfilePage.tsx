import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../../lib/api"
import type { Business, Order, Page, Product } from "../../lib/types"
import { ProductCard } from "../../components/market/ProductCard"
import { StarRating } from "../../components/market/StarRating"
import { ReviewSection } from "../../components/market/ReviewSection"
import { ErrorState } from "../../components/ui/StatePanel"
import { SkeletonCard, SkeletonGrid } from "../../components/ui/Skeleton"

export function BusinessProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    api.get<Business>(`/businesses/${id}`).then(setBusiness).catch((e) => setError(e.message))
    api
      .get<Page<Product>>(`/businesses/${id}/products?size=50`)
      .then((page) => setProducts(page.content))
      .catch(() => setProducts([]))
    api
      .get<Page<Order>>("/orders/mine?size=50")
      .then((page) => {
        const completed = page.content.find((o) => o.businessId === id && o.status === "COMPLETED")
        setEligibleOrderId(completed?.id ?? null)
      })
      .catch(() => setEligibleOrderId(null))
  }, [id])

  useEffect(load, [load])

  if (error) {
    return (
      <div className="page">
        <ErrorState title="We couldn't load this seller" description={error} onRetry={load} />
      </div>
    )
  }
  if (!business || !id) {
    return (
      <div className="page stack">
        <SkeletonCard lines={3} />
      </div>
    )
  }

  return (
    <div className="page stack">
      <div className="card business-header">
        <div className="business-header-logo" aria-hidden="true">
          {business.logoUrl ? <img src={business.logoUrl} alt="" /> : <span>{business.name[0]?.toUpperCase()}</span>}
        </div>
        <div>
          <h1>{business.name}</h1>
          <div className="row wrap">
            <span className="badge">{business.category}</span>
            {business.location && <span className="muted">{business.location}</span>}
            {business.ratingCount > 0 && (
              <StarRating value={business.ratingAverage} count={business.ratingCount} />
            )}
          </div>
          {business.description && <p>{business.description}</p>}
          {(business.contactPhone || business.contactEmail) && (
            <p className="muted">
              {business.contactPhone}
              {business.contactPhone && business.contactEmail ? " · " : ""}
              {business.contactEmail}
            </p>
          )}
        </div>
      </div>

      <section>
        <h2>Listings</h2>
        {products === null ? (
          <SkeletonGrid count={3} columns="product-grid" />
        ) : products.length === 0 ? (
          <p className="muted">This seller hasn't published anything yet.</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <ReviewSection targetType="BUSINESS" targetId={id} eligibleOrderId={eligibleOrderId} />
    </div>
  )
}
