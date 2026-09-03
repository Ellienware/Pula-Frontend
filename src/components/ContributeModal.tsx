import { useState, type FormEvent } from "react"
import { api } from "../lib/api"
import type { Circle, Contribution, Goal, PaymentRequestItem } from "../lib/types"
import { formatMoney } from "../lib/format"
import { Modal } from "./Modal"

export function ContributeModal({
  circle,
  goals = [],
  paymentRequest = null,
  initialGoalId = null,
  onClose,
  onDone,
}: {
  circle: Circle
  goals?: Goal[]
  paymentRequest?: PaymentRequestItem | null
  initialGoalId?: string | null
  onClose: () => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState(paymentRequest ? String(paymentRequest.amountPerMember) : "")
  const [goalId, setGoalId] = useState(initialGoalId ?? "")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Contribution | null>(null)

  const activeGoals = goals.filter((g) => g.status === "ACTIVE")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      // Idempotency key prevents a double-submit from charging twice.
      const idempotencyKey = crypto.randomUUID()
      const res = await api.post<Contribution>(`/circles/${circle.id}/contributions`, {
        amount: Number(amount),
        goalId: goalId || null,
        paymentRequestId: paymentRequest?.id ?? null,
        idempotencyKey,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    const ok = result.status === "SUCCESSFUL"
    const pending = result.status === "PROCESSING" || result.status === "PENDING"
    return (
      <Modal title="Contribution" onClose={onDone}>
        <div className={`result-block ${ok ? "ok" : pending ? "pending" : "fail"}`}>
          <span className="result-icon" aria-hidden="true">
            {ok ? "\u2713" : pending ? "\u2026" : "\u2715"}
          </span>
          <h3>{ok ? "Contribution successful" : pending ? "Payment is processing" : "Payment failed"}</h3>
          <p className="result-amount">{formatMoney(result.amount, result.currency)}</p>
          {result.goalTitle && <p className="muted">Earmarked to {result.goalTitle}</p>}
          <p className="muted">
            {ok
              ? "Funds have been added to the circle balance."
              : pending
                ? "You'll be notified once the mobile money transfer settles."
                : "No funds were charged. Please try again."}
          </p>
          {result.providerReference && (
            <p className="result-ref">Ref: {result.providerReference}</p>
          )}
          <button className="btn btn-primary btn-block" onClick={onDone}>
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Contribute to ${circle.name}`} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        {paymentRequest && (
          <div className="callout" role="note">
            Fulfilling a request for {formatMoney(paymentRequest.amountPerMember, circle.currency)} per member
            {paymentRequest.note ? ` — ${paymentRequest.note}` : ""}.
          </div>
        )}

        <label className="field">
          <span>Amount ({circle.currency})</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </label>

        {activeGoals.length > 0 && (
          <label className="field">
            <span>Earmark to goal (optional)</span>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">Circle balance</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="sandbox-hint" role="note">
          <strong>Sandbox mode.</strong> No real money moves. The outcome is driven by the mobile-money
          number on your profile:
          <ul>
            <li>
              <code>0000</code> ending — fails (insufficient funds)
            </li>
            <li>
              <code>0001</code> ending — stays processing
            </li>
            <li>any other ending — succeeds</li>
          </ul>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Processing\u2026" : `Pay ${amount ? formatMoney(Number(amount), circle.currency) : ""}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
