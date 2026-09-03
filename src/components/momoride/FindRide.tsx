import { FormEvent, useEffect, useState } from "react"
import { ChevronLeft } from "lucide-react"
import { api } from "../../lib/api"
import type { Ride, RideBooking } from "../../lib/types"
import { formatMoney, humanize } from "../../lib/format"
import { useToast } from "../../context/ToastContext"
import { RideCard } from "./RideCard"
import { ConfirmDialog } from "../ui/ConfirmDialog"
import { StarRating } from "../market/StarRating"
import { EmptyState, ErrorState } from "../ui/StatePanel"
import { SkeletonCard } from "../ui/Skeleton"

export function FindRide({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [rides, setRides] = useState<Ride[] | null>(null)
  const [bookings, setBookings] = useState<RideBooking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingBook, setPendingBook] = useState<Ride | null>(null)
  const [booking, setBooking] = useState(false)
  const [ratingDraft, setRatingDraft] = useState<Record<string, number>>({})

  function loadRides(o = origin, d = destination) {
    const params = new URLSearchParams()
    if (o) params.set("origin", o)
    if (d) params.set("destination", d)
    api
      .get<Ride[]>(`/momoride/rides${params.toString() ? `?${params}` : ""}`)
      .then(setRides)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load rides"))
  }

  function loadBookings() {
    api.get<RideBooking[]>("/momoride/bookings/me").then(setBookings).catch(() => setBookings([]))
  }

  useEffect(() => {
    loadRides("", "")
    loadBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function search(e: FormEvent) {
    e.preventDefault()
    setError(null)
    loadRides()
  }

  async function confirmBook() {
    if (!pendingBook) return
    setBooking(true)
    try {
      const b = await api.post<RideBooking>(`/momoride/rides/${pendingBook.id}/book`, {
        idempotencyKey: crypto.randomUUID(),
      })
      setBookings((prev) => [b, ...(prev ?? [])])
      showToast(`Ride ${b.status.toLowerCase()} ✓`, b.status === "CONFIRMED" ? "success" : "default")
      loadRides()
      setPendingBook(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Booking failed", "error")
      setPendingBook(null)
    } finally {
      setBooking(false)
    }
  }

  async function cancelBooking(id: string) {
    try {
      await api.post(`/momoride/bookings/${id}/cancel`, {})
      showToast("Booking cancelled", "success")
      loadBookings()
      loadRides()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel booking", "error")
    }
  }

  async function rateRide(rideId: string) {
    const rating = ratingDraft[rideId] ?? 5
    try {
      await api.post(`/momoride/rides/${rideId}/rate`, { rating, comment: null })
      showToast("Thanks for rating your ride", "success")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit rating", "error")
    }
  }

  return (
    <div className="page">
      <button className="ride-flow-back" onClick={onBack}>
        <ChevronLeft size={16} aria-hidden="true" /> MoMoRide
      </button>
      <h1>Find a shared ride</h1>
      <p className="muted" style={{ marginBottom: "var(--space-5)" }}>
        Search for rides other MoMo drivers are offering.
      </p>

      <form className="ride-search-form" onSubmit={search}>
        <div className="field">
          <label htmlFor="ride-origin">From</label>
          <input id="ride-origin" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Durban" />
        </div>
        <div className="field">
          <label htmlFor="ride-destination">To</label>
          <input
            id="ride-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Umhlanga"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      {error && <ErrorState description={error} onRetry={() => loadRides()} />}

      {rides === null ? (
        <div className="stack">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      ) : rides.length === 0 ? (
        <EmptyState
          title="No rides match your search"
          description="Try a different route, or check back later — new rides are added throughout the day."
        />
      ) : (
        <div className="ride-list">
          {rides.map((r) => (
            <RideCard key={r.id} ride={r} onBook={setPendingBook} />
          ))}
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <>
          <div className="section-head">
            <h2>My bookings</h2>
          </div>
          <div className="card">
            {bookings.map((b) => (
              <div className="booking-row" key={b.id}>
                <div>
                  <strong>{humanize(b.status)}</strong>
                  <span className="muted"> · payment {humanize(b.paymentStatus)}</span>
                </div>
                <div className="row">
                  {b.status === "CONFIRMED" && (
                    <>
                      <span className="rating-inline">
                        <StarRating
                          value={ratingDraft[b.rideId] ?? 5}
                          onChange={(v) => setRatingDraft({ ...ratingDraft, [b.rideId]: v })}
                        />
                        <button className="btn btn-ghost btn-sm" onClick={() => rateRide(b.rideId)}>
                          Rate
                        </button>
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={() => cancelBooking(b.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pendingBook && (
        <ConfirmDialog
          title="Confirm booking"
          rows={[
            { label: "Route", value: `${pendingBook.origin} → ${pendingBook.destination}` },
            { label: "Driver", value: pendingBook.driverName },
            { label: "Price", value: formatMoney(pendingBook.pricePerPassenger, pendingBook.currency) },
          ]}
          confirmLabel="Book seat"
          loading={booking}
          onConfirm={confirmBook}
          onCancel={() => setPendingBook(null)}
        />
      )}
    </div>
  )
}
