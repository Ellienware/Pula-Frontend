import { useEffect, useState, type FormEvent } from "react"
import { api } from "../lib/api"
import { useCurrencyConfig } from "../lib/currencyConfig"
import { type Circle, type CircleType, CIRCLE_TYPE_LABELS } from "../lib/types"
import { Modal } from "./Modal"

const TYPES: CircleType[] = ["SAVINGS_GOAL", "ROTATING", "EXPENSE_POOL"]

export function CreateCircleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { defaultCurrency, supportedCurrencies } = useCurrencyConfig()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<CircleType>("SAVINGS_GOAL")
  const [currency, setCurrency] = useState(defaultCurrency)
  const [goalAmount, setGoalAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Config loads async — once it resolves, snap the still-untouched default over to it
  // instead of leaving the field on the FALLBACK value from before the fetch completed.
  useEffect(() => {
    setCurrency((prev) => (supportedCurrencies.includes(prev) ? prev : defaultCurrency))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCurrency, supportedCurrencies.join(",")])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post<Circle>("/circles", {
        name,
        description: description || null,
        type,
        currency,
        goalAmount: goalAmount ? Number(goalAmount) : null,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create circle")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Create a circle" onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Circle name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Family Savings" />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What is this circle for?"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as CircleType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {CIRCLE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {supportedCurrencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Goal amount (optional)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="5000"
          />
        </label>
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
            {busy ? "Creating…" : "Create circle"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
