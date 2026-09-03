import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import type { Product } from "../../lib/types"
import { formatMoney } from "../../lib/format"
import { StarRating } from "./StarRating"
import { useMarket } from "../../context/MarketContext"
import { useToast } from "../../context/ToastContext"

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = !product.isService && product.stock <= 0
  const { addToCart } = useMarket()
  const { showToast } = useToast()
  const [adding, setAdding] = useState(false)

  async function quickAdd(e: React.MouseEvent) {
    // Card is a Link to the product page — a quick-add click shouldn't navigate away.
    e.preventDefault()
    e.stopPropagation()
    if (adding) return
    setAdding(true)
    try {
      await addToCart(product.id, 1)
      showToast(`Added ${product.name} to cart ✓`, "success")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add to cart", "error")
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link to={`/market/products/${product.id}`} className="product-card">
      <div className="product-card-image" aria-hidden="true">
        {product.imageUrls[0] ? (
          <img src={product.imageUrls[0]} alt="" />
        ) : (
          <span className="product-card-placeholder">{product.isService ? "🛠️" : "🛍️"}</span>
        )}
        {product.isService && <span className="badge product-card-tag">Service</span>}
        {outOfStock && <span className="badge failed product-card-tag right">Out of stock</span>}
        {!outOfStock && !product.isService && (
          <button
            className="product-card-quick-add"
            onClick={quickAdd}
            disabled={adding}
            aria-label={`Add ${product.name} to cart`}
            title="Add to cart"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="product-card-body">
        <span className="muted product-card-business">{product.businessName}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <div className="row between">
          <span className="money">{formatMoney(product.price, product.currency)}</span>
          {product.ratingCount > 0 && <StarRating value={product.ratingAverage} count={product.ratingCount} />}
        </div>
      </div>
    </Link>
  )
}
