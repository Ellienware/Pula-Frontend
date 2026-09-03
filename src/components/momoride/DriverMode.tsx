import { FormEvent, useEffect, useState } from "react"
import QRCode from "qrcode"
import { ChevronLeft, Copy, QrCode, Check } from "lucide-react"
import { api } from "../../lib/api"
import type { DriverResponse, Ride, TaxiPaymentRequestItem } from "../../lib/types"
import { formatDateTime, formatMoney, humanize } from "../../lib/format"
import { useToast } from "../../context/ToastContext"
import { Button } from "../ui/Button"
import { EmptyState } from "../ui/StatePanel"

export function DriverMode({
  driver,
  onDriverChange,
  defaultCurrency,
  onBack,
}: {
  driver: DriverResponse | null
  onDriverChange: (d: DriverResponse) => void
  defaultCurrency: string
  onBack: () => void
}) {
  if (!driver) {
    return <DriverRegistration onDriverChange={onDriverChange} onBack={onBack} />
  }
  return <DriverDashboard driver={driver} defaultCurrency={defaultCurrency} onBack={onBack} />
}

function DriverRegistration({
  onDriverChange,
  onBack,
}: {
  onDriverChange: (d: DriverResponse) => void
  onBack: () => void
}) {
  const { showToast } = useToast()
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [makeModel, setMakeModel] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function registerDriver(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const d = await api.post<DriverResponse>("/momoride/drivers", { registrationNumber, makeModel, pin })
      onDriverChange(d)
      showToast(`Driver profile created — your taxi payment code is ${d.taxi?.paymentCode}`, "success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Driver registration failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <button className="ride-flow-back" onClick={onBack}>
        <ChevronLeft size={16} aria-hidden="true" /> MoMoRide
      </button>
      <h1>Become a MoMoRide driver</h1>
      <p className="muted" style={{ marginBottom: "var(--space-6)" }}>
        No taxi association is required — register your own vehicle to start accepting taxi payments and offering
        shared rides.
      </p>

      <form className="card stack" onSubmit={registerDriver} style={{ maxWidth: 420 }}>
        <div className="field">
          <label htmlFor="reg-number">Taxi registration</label>
          <input
            id="reg-number"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="NB 23 TR GP"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="make-model">Make / model</label>
          <input id="make-model" value={makeModel} onChange={(e) => setMakeModel(e.target.value)} placeholder="Toyota Quantum" />
        </div>
        <div className="field">
          <label htmlFor="driver-pin">MoMoRide PIN (4–6 digits, for USSD)</label>
          <input
            id="driver-pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="1234"
            pattern="\d{4,6}"
            required
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting}>
          Register taxi
        </Button>
      </form>
    </div>
  )
}

function DriverDashboard({
  driver,
  defaultCurrency,
  onBack,
}: {
  driver: DriverResponse
  defaultCurrency: string
  onBack: () => void
}) {
  const { showToast } = useToast()
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [myRides, setMyRides] = useState<Ride[] | null>(null)
  const [myRequests, setMyRequests] = useState<TaxiPaymentRequestItem[] | null>(null)

  const [requestAmount, setRequestAmount] = useState("")
  const [requestPhone, setRequestPhone] = useState("")
  const [requestingPayment, setRequestingPayment] = useState(false)

  const [newRide, setNewRide] = useState({ origin: "", destination: "", departureTime: "", seats: "1", price: "" })
  const [creatingRide, setCreatingRide] = useState(false)

  function loadExtras() {
    api.get<Ride[]>("/momoride/rides/me").then(setMyRides).catch(() => setMyRides([]))
    api
      .get<TaxiPaymentRequestItem[]>("/momoride/payment-requests/me")
      .then(setMyRequests)
      .catch(() => setMyRequests([]))
  }

  useEffect(loadExtras, [])

  useEffect(() => {
    if (driver.taxi?.qrPayload) {
      QRCode.toDataURL(driver.taxi.qrPayload, { margin: 1, width: 220 }).then(setQrDataUrl).catch(() => setQrDataUrl(""))
    }
  }, [driver.taxi?.qrPayload])

  function copyCode() {
    if (!driver.taxi) return
    navigator.clipboard.writeText(driver.taxi.paymentCode).then(() => showToast("Copied ✓", "success"))
  }

  async function requestPayment(e: FormEvent) {
    e.preventDefault()
    setRequestingPayment(true)
    try {
      await api.post("/momoride/payment-requests", {
        amount: Number(requestAmount),
        currency: defaultCurrency,
        passengerPhone: requestPhone || null,
      })
      showToast("Payment request created ✓", "success")
      setRequestAmount("")
      setRequestPhone("")
      loadExtras()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create payment request", "error")
    } finally {
      setRequestingPayment(false)
    }
  }

  async function cancelRequest(id: string) {
    try {
      await api.post(`/momoride/payment-requests/${id}/cancel`, {})
      loadExtras()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel request", "error")
    }
  }

  async function createRide(e: FormEvent) {
    e.preventDefault()
    setCreatingRide(true)
    try {
      await api.post("/momoride/rides", {
        origin: newRide.origin,
        destination: newRide.destination,
        departureTime: newRide.departureTime,
        availableSeats: Number(newRide.seats),
        pricePerPassenger: Number(newRide.price || 0),
        currency: defaultCurrency,
      })
      showToast("Ride offered ✓", "success")
      setNewRide({ origin: "", destination: "", departureTime: "", seats: "1", price: "" })
      loadExtras()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create ride", "error")
    } finally {
      setCreatingRide(false)
    }
  }

  async function completeRide(id: string) {
    try {
      await api.post(`/momoride/rides/${id}/complete`, {})
      showToast("Ride marked complete ✓", "success")
      loadExtras()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not complete ride", "error")
    }
  }

  async function cancelRide(id: string) {
    try {
      await api.post(`/momoride/rides/${id}/cancel`, {})
      loadExtras()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel ride", "error")
    }
  }

  const today = new Date().toDateString()
  const todaysRides = (myRides ?? []).filter((r) => new Date(r.departureTime).toDateString() === today)
  const upcomingRides = (myRides ?? []).filter((r) => new Date(r.departureTime).toDateString() !== today)

  return (
    <div className="page">
      <button className="ride-flow-back" onClick={onBack}>
        <ChevronLeft size={16} aria-hidden="true" /> MoMoRide
      </button>

      <div className="driver-status-row">
        <div>
          <h1>{driver.driverName}</h1>
          <span className="badge success driver-status-badge">{humanize(driver.status)}</span>
        </div>
      </div>

      {driver.taxi && (
        <div className="taxi-hero">
          <span className="taxi-hero-label">Your taxi payment code</span>
          <div className="taxi-hero-code">{driver.taxi.paymentCode}</div>
          <div className="taxi-hero-meta">
            {driver.taxi.publicTaxiId} · {driver.taxi.registrationNumber}
            {driver.taxi.makeModel ? ` · ${driver.taxi.makeModel}` : ""}
          </div>
          <div className="taxi-hero-actions">
            <button className="btn btn-ghost" onClick={copyCode}>
              <Copy size={16} aria-hidden="true" /> Copy
            </button>
            <button className="btn btn-ghost" onClick={() => setShowQr((s) => !s)}>
              <QrCode size={16} aria-hidden="true" /> {showQr ? "Hide QR" : "Show QR"}
            </button>
          </div>
          {showQr && (
            <div className="taxi-hero-qr">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan to pay this taxi" width={180} height={180} />
              ) : (
                <span className="muted">QR unavailable — share the code above instead.</span>
              )}
            </div>
          )}
        </div>
      )}

      <h2 className="driver-section-title">Request a payment</h2>
      <form className="card stack" onSubmit={requestPayment} style={{ maxWidth: 420 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="req-amount">Amount ({defaultCurrency})</label>
          <input
            id="req-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={requestAmount}
            onChange={(e) => setRequestAmount(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="req-phone">Passenger phone (optional)</label>
          <input id="req-phone" value={requestPhone} onChange={(e) => setRequestPhone(e.target.value)} placeholder="08XXXXXXXX" />
        </div>
        <Button type="submit" loading={requestingPayment}>
          Request payment
        </Button>
      </form>

      {myRequests === null ? null : myRequests.length > 0 ? (
        <div style={{ marginTop: "var(--space-3)" }}>
          {myRequests.map((r) => (
            <div className="request-row" key={r.id}>
              <div>
                <strong className="money">{formatMoney(r.amount, r.currency)}</strong>
                <span className="badge" style={{ marginLeft: 8 }}>
                  {humanize(r.status)}
                </span>
              </div>
              {r.status === "OPEN" && (
                <button className="btn btn-ghost btn-sm" onClick={() => cancelRequest(r.id)}>
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <h2 className="driver-section-title">Offer a ride</h2>
      <form className="ride-search-form" onSubmit={createRide} style={{ marginBottom: "var(--space-4)" }}>
        <div className="field">
          <label htmlFor="new-origin">From</label>
          <input id="new-origin" value={newRide.origin} onChange={(e) => setNewRide({ ...newRide, origin: e.target.value })} required />
        </div>
        <div className="field">
          <label htmlFor="new-destination">To</label>
          <input
            id="new-destination"
            value={newRide.destination}
            onChange={(e) => setNewRide({ ...newRide, destination: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="new-departure">Departure</label>
          <input
            id="new-departure"
            type="datetime-local"
            value={newRide.departureTime}
            onChange={(e) => setNewRide({ ...newRide, departureTime: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="new-seats">Seats</label>
          <input
            id="new-seats"
            type="number"
            min="1"
            value={newRide.seats}
            onChange={(e) => setNewRide({ ...newRide, seats: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="new-price">Fare per passenger ({defaultCurrency})</label>
          <input
            id="new-price"
            type="number"
            min="0"
            step="0.01"
            value={newRide.price}
            onChange={(e) => setNewRide({ ...newRide, price: e.target.value })}
            required
          />
        </div>
        <Button type="submit" loading={creatingRide}>
          Offer ride
        </Button>
      </form>

      {myRides === null ? null : myRides.length === 0 ? (
        <EmptyState title="No rides offered yet" description="Rides you offer will show up here." />
      ) : (
        <>
          {todaysRides.length > 0 && (
            <>
              <h3 className="driver-section-title" style={{ marginTop: "var(--space-5)" }}>
                Today
              </h3>
              {todaysRides.map((r) => (
                <MyRideRow key={r.id} ride={r} onComplete={completeRide} onCancel={cancelRide} />
              ))}
            </>
          )}
          {upcomingRides.length > 0 && (
            <>
              <h3 className="driver-section-title" style={{ marginTop: "var(--space-5)" }}>
                Upcoming
              </h3>
              {upcomingRides.map((r) => (
                <MyRideRow key={r.id} ride={r} onComplete={completeRide} onCancel={cancelRide} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

function MyRideRow({ ride, onComplete, onCancel }: { ride: Ride; onComplete: (id: string) => void; onCancel: (id: string) => void }) {
  const active = ride.status === "OPEN" || ride.status === "FULL"
  return (
    <div className="my-ride-row">
      <div>
        <strong>
          {ride.origin} → {ride.destination}
        </strong>
        <div className="muted">
          {formatDateTime(ride.departureTime)} · {humanize(ride.status)}
        </div>
      </div>
      {active && (
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={() => onComplete(ride.id)}>
            <Check size={13} aria-hidden="true" /> Complete
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onCancel(ride.id)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
