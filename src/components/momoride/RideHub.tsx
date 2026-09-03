import { useEffect, useState } from "react"
import { Car, CreditCard, Search } from "lucide-react"
import { api } from "../../lib/api"
import type { DriverResponse, RideBooking } from "../../lib/types"
import { humanize } from "../../lib/format"
import { PageHeader } from "../ui/PageHeader"
import { EmptyState } from "../ui/StatePanel"
import { SkeletonCard } from "../ui/Skeleton"

type View = "home" | "pay" | "find" | "driver"

export function RideHub({ driver, onNavigate }: { driver: DriverResponse | null; onNavigate: (view: View) => void }) {
  const [bookings, setBookings] = useState<RideBooking[] | null>(null)

  useEffect(() => {
    api
      .get<RideBooking[]>("/momoride/bookings/me")
      .then((b) => setBookings(b.slice(0, 3)))
      .catch(() => setBookings([]))
  }, [])

  return (
    <div className="page">
      <PageHeader title="MoMoRide" subtitle="Pay taxi fares and find shared rides from your MoMoCircle account." />

      <div className="ride-hub-tiles">
        <button className="ride-hub-tile ride-hub-tile-pay" onClick={() => onNavigate("pay")}>
          <span className="ride-hub-tile-icon">
            <CreditCard size={22} aria-hidden="true" />
          </span>
          <div>
            <h3>Pay Taxi</h3>
            <p>Enter a payment code or scan a QR to pay your fare.</p>
          </div>
        </button>
        <button className="ride-hub-tile ride-hub-tile-find" onClick={() => onNavigate("find")}>
          <span className="ride-hub-tile-icon">
            <Search size={22} aria-hidden="true" />
          </span>
          <div>
            <h3>Find a Ride</h3>
            <p>Search shared rides other drivers are offering.</p>
          </div>
        </button>
        <button
          className={`ride-hub-tile ride-hub-tile-driver ${driver ? "is-active" : ""}`}
          onClick={() => onNavigate("driver")}
        >
          <span className="ride-hub-tile-icon">
            <Car size={22} aria-hidden="true" />
          </span>
          <div>
            <h3>Driver Mode</h3>
            <p>{driver ? "Manage your taxi, rides and payment requests." : "Register your taxi to start earning."}</p>
          </div>
        </button>
      </div>

      <div className="section-head">
        <h2>Recent rides</h2>
      </div>
      {bookings === null ? (
        <SkeletonCard lines={2} />
      ) : bookings.length === 0 ? (
        <EmptyState title="No rides yet" description="Rides you book will appear here." />
      ) : (
        <div className="card">
          {bookings.map((b) => (
            <div className="booking-row" key={b.id}>
              <span>{humanize(b.status)}</span>
              <span className="muted">payment {humanize(b.paymentStatus)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
