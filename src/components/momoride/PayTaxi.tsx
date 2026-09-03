import { FormEvent, useState } from "react"
import { ChevronLeft, Flag, ScanLine, CheckCircle2, Clock, XCircle } from "lucide-react"
import { api } from "../../lib/api"
import type { Taxi, TaxiPayment } from "../../lib/types"
import { formatMoney, humanize } from "../../lib/format"
import { Button } from "../ui/Button"
import { ConfirmDialog } from "../ui/ConfirmDialog"
import { ReportDialog } from "./ReportDialog"

type Step = "code" | "review" | "success"

export function PayTaxi({ defaultCurrency, onBack }: { defaultCurrency: string; onBack: () => void }) {
  const [step, setStep] = useState<Step>("code")
  const [paymentCode, setPaymentCode] = useState("")
  const [taxi, setTaxi] = useState<Taxi | null>(null)
  const [amount, setAmount] = useState("")
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)
  const [paying, setPaying] = useState(false)
  const [result, setResult] = useState<TaxiPayment | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  // "Pay a driver's payment request instead" — kept as a lightweight alternate path,
  // same as the original page, rather than folded into the code-lookup flow.
  const [showRequestPay, setShowRequestPay] = useState(false)
  const [requestId, setRequestId] = useState("")
  const [requestPaying, setRequestPaying] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestResult, setRequestResult] = useState<TaxiPayment | null>(null)

  async function lookup(e: FormEvent) {
    e.preventDefault()
    setLookupError(null)
    setLooking(true)
    try {
      const found = await api.get<Taxi>(`/momoride/taxis/by-code/${encodeURIComponent(paymentCode.trim())}`)
      setTaxi(found)
    } catch (err) {
      setTaxi(null)
      setLookupError(err instanceof Error ? err.message : "Taxi not found")
    } finally {
      setLooking(false)
    }
  }

  function reviewPayment(e: FormEvent) {
    e.preventDefault()
    if (!taxi || !amount) return
    setStep("review")
  }

  async function confirmPay() {
    if (!taxi) return
    setPaying(true)
    setPayError(null)
    try {
      const payment = await api.post<TaxiPayment>("/momoride/payments/taxi", {
        paymentCode: taxi.paymentCode,
        amount: Number(amount),
        currency: defaultCurrency,
        idempotencyKey: crypto.randomUUID(),
      })
      setResult(payment)
      setStep("success")
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment failed")
      setStep("code")
    } finally {
      setPaying(false)
    }
  }

  async function payRequestInstead(e: FormEvent) {
    e.preventDefault()
    setRequestPaying(true)
    setRequestError(null)
    try {
      const payment = await api.post<TaxiPayment>(`/momoride/payment-requests/${requestId}/pay`, {
        idempotencyKey: crypto.randomUUID(),
      })
      setRequestResult(payment)
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setRequestPaying(false)
    }
  }

  function resetFlow() {
    setStep("code")
    setPaymentCode("")
    setTaxi(null)
    setAmount("")
    setResult(null)
    setLookupError(null)
    setPayError(null)
  }

  if (step === "success" && result) {
    const outcome = result.status === "SUCCESSFUL" ? "ok" : result.status === "PENDING" || result.status === "PROCESSING" ? "pending" : "fail"
    const Icon = outcome === "ok" ? CheckCircle2 : outcome === "pending" ? Clock : XCircle
    return (
      <div className="page">
        <div className={`ride-result ${outcome}`}>
          <div className="ride-result-icon">
            <Icon size={34} aria-hidden="true" />
          </div>
          <h2>{outcome === "ok" ? "Payment successful" : outcome === "pending" ? "Payment processing" : "Payment failed"}</h2>
          <div className="ride-result-amount">{formatMoney(result.amount, result.currency)}</div>
          <div className="ride-result-meta">
            Taxi {result.publicTaxiId} · {result.driverName}
          </div>
          <div className="ride-result-meta">{new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</div>
          <div className="ride-result-actions">
            <Button variant="ghost" onClick={resetFlow}>
              Pay another
            </Button>
            <Button onClick={onBack}>Done</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <button className="ride-flow-back" onClick={onBack}>
        <ChevronLeft size={16} aria-hidden="true" /> MoMoRide
      </button>
      <h1>Pay a taxi</h1>
      <p className="muted" style={{ marginBottom: "var(--space-6)" }}>
        Enter the payment code displayed by the driver, or scan their QR code.
      </p>

      <div className="ride-code-form">
        <form onSubmit={lookup}>
          <label className="amount-field-label" htmlFor="taxi-code">
            Taxi payment code
          </label>
          <div className="ride-code-input-wrap">
            <input
              id="taxi-code"
              className="ride-code-input"
              value={paymentCode}
              onChange={(e) => {
                setPaymentCode(e.target.value)
                setTaxi(null)
              }}
              placeholder="48291"
              required
            />
          </div>
          <Button type="submit" block loading={looking} disabled={!paymentCode.trim()}>
            <ScanLine size={16} aria-hidden="true" /> Find taxi
          </Button>
          {lookupError && (
            <p className="error-text" role="alert" style={{ marginTop: 10 }}>
              {lookupError}
            </p>
          )}
        </form>

        {taxi && (
          <form onSubmit={reviewPayment}>
            <div className="taxi-found-card">
              <div className="taxi-found-head">
                <span className="taxi-found-avatar" aria-hidden="true">
                  {taxi.driverName[0]?.toUpperCase()}
                </span>
                <div>
                  <div className="taxi-found-name">{taxi.driverName}</div>
                  <div className="taxi-found-meta">
                    {taxi.publicTaxiId} · {taxi.registrationNumber}
                    {taxi.makeModel ? ` · ${taxi.makeModel}` : ""}
                  </div>
                </div>
              </div>

              <label className="amount-field-label" htmlFor="fare-amount">
                Fare
              </label>
              <div className="amount-input-wrap">
                <span className="amount-input-currency">{defaultCurrency}</span>
                <input
                  id="fare-amount"
                  className="amount-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="row" style={{ marginTop: "var(--space-4)" }}>
                <Button type="submit" disabled={!amount || Number(amount) <= 0} block>
                  Continue
                </Button>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "var(--space-3)" }}
                onClick={() => setShowReport(true)}
              >
                <Flag size={13} aria-hidden="true" /> Report this taxi
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: "var(--space-6)" }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowRequestPay((s) => !s)}>
            {showRequestPay ? "Hide" : "Pay a driver's payment request instead"}
          </button>
          {showRequestPay && (
            <form className="taxi-found-card stack" onSubmit={payRequestInstead} style={{ marginTop: "var(--space-3)" }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="request-id">Payment request ID (from SMS/notification)</label>
                <input id="request-id" value={requestId} onChange={(e) => setRequestId(e.target.value)} required />
              </div>
              <Button type="submit" loading={requestPaying} disabled={!requestId.trim()}>
                Pay request
              </Button>
              {requestError && (
                <p className="error-text" role="alert">
                  {requestError}
                </p>
              )}
              {requestResult && (
                <p className="notice success">
                  Payment {humanize(requestResult.status)} — ref {requestResult.paymentId}
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {taxi && step === "review" && (
        <ConfirmDialog
          title="Confirm payment"
          rows={[
            { label: "Taxi", value: taxi.publicTaxiId },
            { label: "Driver", value: taxi.driverName },
            { label: "Amount", value: formatMoney(Number(amount), defaultCurrency) },
          ]}
          confirmLabel="Confirm payment"
          loading={paying}
          onConfirm={confirmPay}
          onCancel={() => setStep("code")}
        />
      )}
      {payError && step === "code" && (
        <p className="error-text" role="alert">
          {payError}
        </p>
      )}

      {showReport && taxi && (
        <ReportDialog taxiId={taxi.id} taxiLabel={taxi.publicTaxiId} onClose={() => setShowReport(false)} />
      )}
    </div>
  )
}
