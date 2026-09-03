import { useState, type FormEvent } from "react"
import { api } from "../lib/api"
import type { Circle, Goal, RecurringFrequency, RecurringPlan } from "../lib/types"
import { Modal } from "./Modal"

const FREQUENCIES: RecurringFrequency[] = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]

export function RecurringModal({
  circle,
  goals = [],
  onClose,
  onDone,
}: {
  circle: Circle
  goals?: Goal[]
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState("")
  const [amountPerMember, setAmountPerMember] = useState("")
  const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY")
  const [startDate, setStartDate] = useState("")
  const [goalId, setGoalId] = useState("")
  const [note, setNote] = useState("")
  const [generateFirstPeriod, setGenerateFirstPeriod] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const activeGoals = goals.filter((g) => g.status === "ACTIVE")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post<RecurringPlan>(`/circles/${circle.id}/recurring`, {
        title,
        amountPerMember: Number(amountPerMember),
        frequency,
        startDate: startDate || null,
        goalId: goalId || null,
        note: note || null,
        generateFirstPeriod,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="New recurring contribution" onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Plan title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="Monthly dues" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Amount per member ({circle.currency})</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amountPerMember}
              onChange={(e) => setAmountPerMember(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Frequency</span>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Start date (optional)</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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
        </div>
        <label className="field">
          <span>Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Auto-collected each period" />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={generateFirstPeriod}
            onChange={(e) => setGenerateFirstPeriod(e.target.checked)}
          />
          <span>Generate the first collection period now</span>
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
            {busy ? "Creating\u2026" : "Create plan"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
