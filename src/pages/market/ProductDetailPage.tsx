import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Check, Minus, Plus } from "lucide-react"
import { api } from "../../lib/api"
import type { Order, Page, Product } from "../../lib/types"
import { useMarket } from "../../context/MarketContext"
import { useToast } from "../../context/ToastContext"
import { StarRating } from "../../components/market/StarRating"
import { ReviewSection } from "../../components/market/ReviewSection"
import { ErrorState } from "../../components/ui/StatePanel"
import { SkeletonCard } from "../../components/ui/Skeleton"
import { MoneyDisplay } from "../../components/ui/MoneyDisplay"

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useMarket()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    api.get<Product>(`/products/${id}`).then(setProduct).catch((e) => setError(e.message))
    api
      .get<Page<Order>>("/orders/mine?size=50")
      .then((page) => {
        const completed = page.content.find(
          (o) => o.status === "COMPLETED" && o.items.some((i) => i.productId === id),
        )
        setEligibleOrderId(completed?.id ?? null)
      })
      .catch(() => setEligibleOrderId(null))
  }, [id])

  useEffect(load, [load])

  async function handleAdd() {
    if (!product) return
    setStatus("adding")
    try {
      await addToCart(product.id, quantity)
      setStatus("added")
      showToast(`Added ${quantity} × ${product.name} to cart ✓`, "success")
      window.setTimeout(() => setStatus("idle"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to cart")
      setStatus("error")
    }
  }

  if (error && !product) {
    return (
      <div className="page">
        <ErrorState title="We couldn't load this product" description={error} onRetry={load} />
      </div>
    )
  }
  if (!product || !id) {
    return (
      <div className="page">
        <SkeletonCard lines={4} />
      </div>
    )
  }

  const outOfStock = !product.isService && product.stock <= 0

  return (
    <div className="page stack">
      <div className="card product-detail">
        <div className="product-detail-image" aria-hidden="true">
          {product.imageUrls[0] ? (
            <img src={product.imageUrls[0]} alt="" />
          ) : (
            <span className="product-card-placeholder">{product.isService ? "🛠️" : "🛍️"}</span>
          )}
        </div>
        <div className="stack">
          <Link to={`/market/businesses/${product.businessId}`} className="muted">
            {product.businessName}
          </Link>
          <h1>{product.name}</h1>
          <div className="row wrap">
            <span className="badge">{product.category}</span>
            {product.isService && <span className="badge">Service</span>}
            {product.ratingCount > 0 && <StarRating value={product.ratingAverage} count={product.ratingCount} />}
          </div>
          {product.description && <p>{product.description}</p>}

          <MoneyDisplay amount={product.price} currency={product.currency} size="lg" />

          {outOfStock ? (
            <span className="badge failed">Out of stock</span>
          ) : (
            <div className="row wrap">
              {!product.isService && (
                <div className="qty-stepper">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
              <button className="btn btn-primary" onClick={handleAdd} disabled={status === "adding"}>
                {status === "adding" ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" /> Adding…
                  </>
                ) : status === "added" ? (
                  <>
                    <Check size={16} aria-hidden="true" /> Added
                  </>
                ) : (
                  "Add to cart"
                )}
              </button>
              <Link to="/cart" className="btn btn-ghost">
                View cart
              </Link>
            </div>
          )}
          {status === "error" && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <ReviewSection targetType="PRODUCT" targetId={id} eligibleOrderId={eligibleOrderId} />
    </div>
  )
}
