import { Link } from "react-router-dom"
import type { Business } from "../../lib/types"
import { StarRating } from "./StarRating"

export function BusinessCard({ business }: { business: Business }) {
  return (
    <Link to={`/market/businesses/${business.id}`} className="business-card">
      <div className="business-card-logo" aria-hidden="true">
        {business.logoUrl ? <img src={business.logoUrl} alt="" /> : <span>{business.name[0]?.toUpperCase()}</span>}
      </div>
      <div>
        <h3 className="business-card-name">{business.name}</h3>
        <span className="badge">{business.category}</span>
        {business.location && <span className="muted business-card-location"> · {business.location}</span>}
        {business.ratingCount > 0 && (
          <div className="business-card-rating">
            <StarRating value={business.ratingAverage} count={business.ratingCount} />
          </div>
        )}
      </div>
    </Link>
  )
}
