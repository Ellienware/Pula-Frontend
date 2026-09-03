import { MapPin, Users } from "lucide-react"
import type { Ride } from "../../lib/types"
import { formatDateTime, formatMoney } from "../../lib/format"
import { Button } from "../ui/Button"

export function RideCard({ ride, onBook, booking }: { ride: Ride; onBook: (ride: Ride) => void; booking?: boolean }) {
  const bookable = ride.availableSeats > 0 && ride.status === "OPEN"

  return (
    <div className="ride-card">
      <div>
        <div className="ride-card-route">
          <MapPin size={16} aria-hidden="true" />
          {ride.origin} → {ride.destination}
        </div>
        <div className="ride-card-meta">
          <span>{formatDateTime(ride.departureTime)}</span>
          <span>
            <Users size={13} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 3 }} />
            {ride.availableSeats} seat{ride.availableSeats === 1 ? "" : "s"}
          </span>
          <span>Driver: {ride.driverName}</span>
          {ride.status !== "OPEN" && <span className="badge">{ride.status.toLowerCase()}</span>}
        </div>
      </div>
      <div className="row" style={{ gap: 12 }}>
        <div className="ride-card-price">
          <span className="money">{formatMoney(ride.pricePerPassenger, ride.currency)}</span>
          <span className="muted" style={{ fontSize: 11 }}>
            per seat
          </span>
        </div>
        <Button size="sm" disabled={!bookable} loading={booking} onClick={() => onBook(ride)}>
          {bookable ? "Book seat" : "Full"}
        </Button>
      </div>
    </div>
  )
}
