import { useState, type FormEvent } from "react"
import { api } from "../lib/api"
import type { Circle, Goal } from "../lib/types"
import { Modal } from "./Modal"

export function GoalModal({
  circle,
  onClose,
  onDone,
}: {
  circle: Circle
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [deadline, setDeadline] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post<Goal>(`/circles/${circle.id}/goals`, {
        title,
        description: description || null,
        targetAmount: Number(targetAmount),
        deadline: deadline || null,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="New savings goal" onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Goal title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="New generator" />
        </label>
        <label className="field">
          <span>Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What are we saving for?"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Target amount ({circle.currency})</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Deadline (optional)</span>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
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
            {busy ? "Creating\u2026" : "Create goal"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
